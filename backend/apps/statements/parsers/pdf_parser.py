import re
from datetime import datetime
import pdfplumber


class PDFParser:
    """Parses PDF bank statements for GCB, Ecobank, and MTN MoMo."""

    def __init__(self, bank_name='gcb'):
        self.bank_name = bank_name.lower() if bank_name else 'gcb'

    def extract(self, file_path):
        if 'ecobank' in self.bank_name:
            return self._parse_ecobank(file_path)
        elif 'momo' in self.bank_name or 'mtn' in self.bank_name:
            return self._parse_momo(file_path)
        else:
            return self._parse_gcb(file_path)

    # ── GCB Parser ──────────────────────────────────────────

    def _parse_gcb(self, file_path):
        transactions = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        if not row or len(row) < 5:
                            continue
                        tx = self._parse_gcb_row(row)
                        if tx:
                            transactions.append(tx)
        return transactions

    def _parse_gcb_row(self, row):
        row = [cell.strip() if cell else '' for cell in row]
        date_str = row[0]
        debit_str = row[1]
        credit_str = row[2]
        balance_str = row[3]
        description = row[4]

        if not date_str or date_str.lower() in ('date', 'total'):
            return None

        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return None

        debit_str = debit_str.replace(',', '').replace(' ', '')
        credit_str = credit_str.replace(',', '').replace(' ', '')
        balance_str = balance_str.replace(',', '').replace(' ', '')

        if debit_str:
            try:
                amount = float(debit_str)
                tx_type = 'debit'
            except ValueError:
                return None
        elif credit_str:
            try:
                amount = float(credit_str)
                tx_type = 'credit'
            except ValueError:
                return None
        else:
            return None

        try:
            balance = float(balance_str) if balance_str else None
        except ValueError:
            balance = None

        description = ' '.join(description.split())

        return {
            'date': date,
            'description': description,
            'amount': amount,
            'type': tx_type,
            'balance_after': balance,
        }

    # ── Ecobank Parser ──────────────────────────────────────

    def _parse_ecobank(self, file_path):
        transactions = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    if not table or len(table) < 2:
                        continue

                    # Find header row and column positions
                    header_idx = None
                    col_map = {}
                    for i, row in enumerate(table):
                        if not row:
                            continue
                        row_text = ' '.join([c.lower() if c else '' for c in row])
                        if 'transaction' in row_text and 'debit' in row_text:
                            header_idx = i
                            for j, cell in enumerate(row):
                                if not cell:
                                    continue
                                cell_lower = cell.strip().lower()
                                if 'transaction' in cell_lower and 'date' in cell_lower:
                                    col_map['date'] = j
                                elif cell_lower == 'description':
                                    col_map['desc'] = j
                                elif cell_lower == 'debit':
                                    col_map['debit'] = j
                                elif cell_lower == 'credit':
                                    col_map['credit'] = j
                                elif cell_lower == 'balance':
                                    col_map['balance'] = j
                            break

                    if header_idx is None or 'date' not in col_map:
                        continue

                    # Parse data rows after header
                    for row in table[header_idx + 1:]:
                        if not row or len(row) <= max(col_map.values()):
                            continue
                        tx = self._parse_ecobank_row_mapped(row, col_map)
                        if tx:
                            transactions.append(tx)

        return transactions

    def _parse_ecobank_row_mapped(self, row, col_map):
        row = [cell.strip() if cell else '' for cell in row]

        date_str = row[col_map['date']]
        description = row[col_map.get('desc', 1)]
        debit_str = row[col_map.get('debit', 3)]
        credit_str = row[col_map.get('credit', 4)]
        balance_str = row[col_map.get('balance', 5)] if 'balance' in col_map else ''

        if not date_str:
            return None

        skip_words = ['opening balance', 'closing balance']
        if any(w in date_str.lower() for w in skip_words):
            return None
        if any(w in description.lower() for w in skip_words):
            return None

        date = None
        for fmt in ['%d-%b-%Y', '%d-%B-%Y', '%d/%m/%Y']:
            try:
                date = datetime.strptime(date_str, fmt).date()
                break
            except ValueError:
                continue

        if not date:
            return None

        debit_str = debit_str.replace(',', '').replace(' ', '')
        credit_str = credit_str.replace(',', '').replace(' ', '')
        balance_str = balance_str.replace(',', '').replace(' ', '')

        try:
            debit_val = float(debit_str) if debit_str else 0
        except ValueError:
            debit_val = 0

        try:
            credit_val = float(credit_str) if credit_str else 0
        except ValueError:
            credit_val = 0

        if debit_val == 0 and credit_val == 0:
            return None

        if debit_val > 0:
            amount = debit_val
            tx_type = 'debit'
        else:
            amount = credit_val
            tx_type = 'credit'

        try:
            balance = float(balance_str) if balance_str else None
        except ValueError:
            balance = None

        description = ' '.join(description.split())

        return {
            'date': date,
            'description': description,
            'amount': amount,
            'type': tx_type,
            'balance_after': balance,
        }

    # ── MTN MoMo Parser ─────────────────────────────────────

    def _parse_momo(self, file_path):
        transactions = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    if not table or len(table) < 2:
                        continue

                    # Find header row and column positions
                    header_idx = None
                    col_map = {}
                    for i, row in enumerate(table):
                        if not row:
                            continue
                        row_text = ' '.join([c.upper() if c else '' for c in row])
                        if 'TRANSACTION DATE' in row_text and 'AMOUNT' in row_text:
                            header_idx = i
                            for j, cell in enumerate(row):
                                if not cell:
                                    continue
                                cell_upper = cell.strip().upper().replace('\n', ' ')
                                if 'TRANSACTION DATE' in cell_upper:
                                    col_map['date'] = j
                                elif 'FROM NAME' in cell_upper:
                                    col_map['from_name'] = j
                                elif 'TRANS' in cell_upper and 'TYPE' in cell_upper:
                                    col_map['trans_type'] = j
                                elif cell_upper == 'AMOUNT':
                                    col_map['amount'] = j
                                elif 'BAL BEFORE' in cell_upper:
                                    col_map['bal_before'] = j
                                elif 'BAL AFTER' in cell_upper:
                                    col_map['bal_after'] = j
                                elif 'TO NAME' in cell_upper:
                                    col_map['to_name'] = j
                                elif cell_upper == 'OVA':
                                    col_map['ova'] = j
                            break

                    if header_idx is None or 'date' not in col_map:
                        continue

                    for row in table[header_idx + 1:]:
                        if not row:
                            continue
                        tx = self._parse_momo_row_mapped(row, col_map)
                        if tx:
                            transactions.append(tx)

        return transactions

    def _parse_momo_row_mapped(self, row, col_map):
        row = [cell.strip() if cell else '' for cell in row]

        date_str = row[col_map['date']] if col_map['date'] < len(row) else ''
        from_name = row[col_map.get('from_name', 2)] if col_map.get('from_name', 2) < len(row) else ''
        trans_type = row[col_map.get('trans_type', 4)] if col_map.get('trans_type', 4) < len(row) else ''
        amount_str = row[col_map.get('amount', 5)] if col_map.get('amount', 5) < len(row) else ''
        bal_before_str = row[col_map.get('bal_before', 8)] if col_map.get('bal_before', 8) < len(row) else ''
        bal_after_str = row[col_map.get('bal_after', 9)] if col_map.get('bal_after', 9) < len(row) else ''
        to_name = row[col_map.get('to_name', 11)] if col_map.get('to_name', 11) < len(row) else ''
        ova = row[col_map.get('ova', 15)] if col_map.get('ova', 15) < len(row) else ''

        if not date_str:
            return None

        skip_words = ['transaction date', 'time run', 'msisdn', 'from:', 'mobile money', 'powered']
        if any(w in date_str.lower() for w in skip_words):
            return None

        # Parse date
        date = None
        date_str = ' '.join(date_str.split())
        for fmt in ['%d-%b-%Y %I:%M:%S %p', '%d-%b-%Y %H:%M:%S %p', '%d-%b-%Y %I:%M:%S%p', '%d-%b-%Y']:
            try:
                date = datetime.strptime(date_str, fmt).date()
                break
            except ValueError:
                continue

        if not date:
            date_match = re.match(r'(\d{2}-\w{3}-\d{4})', date_str)
            if date_match:
                try:
                    date = datetime.strptime(date_match.group(1), '%d-%b-%Y').date()
                except ValueError:
                    return None
            else:
                return None

        # Parse amount
        amount_str = amount_str.replace(',', '').replace(' ', '')
        try:
            amount = float(amount_str)
        except ValueError:
            return None

        if amount == 0:
            return None

        # Determine type from balance change
        bal_after = None
        try:
            bal_before = float(bal_before_str.replace(',', '').replace(' ', ''))
            bal_after = float(bal_after_str.replace(',', '').replace(' ', ''))
            if bal_after > bal_before:
                tx_type = 'credit'
            else:
                tx_type = 'debit'
        except (ValueError, TypeError):
            credit_types = ['cash_in', 'refund']
            if trans_type.lower().strip() in credit_types:
                tx_type = 'credit'
            else:
                tx_type = 'debit'

        # Build description
        trans_type_clean = ' '.join(trans_type.split())
        from_name_clean = ' '.join(from_name.split())
        to_name_clean = ' '.join(to_name.split())
        ova_clean = ' '.join(ova.split()) if ova else ''

        if tx_type == 'credit':
            description = trans_type_clean + ' from ' + from_name_clean
        else:
            desc_parts = [trans_type_clean]
            if to_name_clean:
                desc_parts.append('to ' + to_name_clean)
            if ova_clean:
                desc_parts.append(ova_clean)
            description = ' '.join(desc_parts)

        description = ' '.join(description.split())
        if not description:
            description = trans_type_clean or 'MoMo Transaction'

        return {
            'date': date,
            'description': description,
            'amount': amount,
            'type': tx_type,
            'balance_after': bal_after,
        }