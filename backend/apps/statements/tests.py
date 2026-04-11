from django.test import TestCase
from apps.statements.parsers import CSVParser, BankDetector


class CSVParserTest(TestCase):
    """Tests for the GCB CSV parser."""

    def setUp(self):
        """This runs before every test — creates sample data."""
        self.parser = CSVParser('gcb')
        self.sample_csv = (
            "Date,Debit,Credit,Balance,Remarks\n"
            "2026-01-22,,403.00,405.54,SALARY PAYMENT FROM EMPLOYER\n"
            "2026-01-22,403.00,,2.54,VISA Card Top Up DMRWZZUZ\n"
            "2026-02-02,,758.00,760.54,MTN MOMO RECEIVED\n"
            "2026-02-02,50.00,,710.54,SHOPRITE ACCRA MALL POS PURCHASE\n"
        )

    def test_parses_correct_number_of_transactions(self):
        """Should find exactly 4 transactions."""
        result = self.parser.extract(self.sample_csv)
        self.assertEqual(len(result), 4)

    def test_identifies_credit_transactions(self):
        """Credits should have type='credit'."""
        result = self.parser.extract(self.sample_csv)
        self.assertEqual(result[0]['type'], 'credit')
        self.assertEqual(result[0]['amount'], 403.00)

    def test_identifies_debit_transactions(self):
        """Debits should have type='debit'."""
        result = self.parser.extract(self.sample_csv)
        self.assertEqual(result[1]['type'], 'debit')
        self.assertEqual(result[1]['amount'], 403.00)

    def test_parses_dates_correctly(self):
        """Dates should be Python date objects."""
        from datetime import date
        result = self.parser.extract(self.sample_csv)
        self.assertEqual(result[0]['date'], date(2026, 1, 22))

    def test_parses_balance(self):
        """Balance after should be parsed as float."""
        result = self.parser.extract(self.sample_csv)
        self.assertEqual(result[0]['balance_after'], 405.54)

    def test_preserves_description(self):
        """Description should come from Remarks column."""
        result = self.parser.extract(self.sample_csv)
        self.assertEqual(result[0]['description'], 'SALARY PAYMENT FROM EMPLOYER')

    def test_skips_header_row(self):
        """Header row should not appear as a transaction."""
        result = self.parser.extract(self.sample_csv)
        descriptions = [tx['description'] for tx in result]
        self.assertNotIn('Remarks', descriptions)

    def test_skips_total_row(self):
        """Rows with 'Total' in date column should be skipped."""
        csv_with_total = self.sample_csv + "Total,2134.00,2134.00,,\n"
        result = self.parser.extract(csv_with_total)
        self.assertEqual(len(result), 4)

    def test_handles_empty_file(self):
        """Empty CSV should return empty list."""
        result = self.parser.extract("Date,Debit,Credit,Balance,Remarks\n")
        self.assertEqual(len(result), 0)

    def test_handles_commas_in_amounts(self):
        """Amounts like 1,234.00 should be parsed correctly."""
        csv_with_comma = (
            "Date,Debit,Credit,Balance,Remarks\n"
            '2026-01-22,,"1,234.00","1,234.00",BIG DEPOSIT\n'
        )
        result = self.parser.extract(csv_with_comma)
        self.assertEqual(result[0]['amount'], 1234.00)


class BankDetectorTest(TestCase):
    """Tests for the bank detection logic."""

    def test_detects_gcb_from_filename(self):
        result = BankDetector.detect('gcb_statement_2026.pdf')
        self.assertEqual(result, 'gcb')

    def test_detects_gcb_from_content(self):
        result = BankDetector.detect('statement.pdf', 'GCB Bank Limited Accra')
        self.assertEqual(result, 'gcb')

    def test_detects_ecobank(self):
        result = BankDetector.detect('ecobank_march.csv')
        self.assertEqual(result, 'ecobank')

    def test_detects_mtn_momo(self):
        result = BankDetector.detect('statement.pdf', 'MTN Mobile Money')
        self.assertEqual(result, 'mtn_momo')

    def test_detects_absa(self):
        result = BankDetector.detect('absa_2026.pdf')
        self.assertEqual(result, 'absa')

    def test_detects_fidelity(self):
        result = BankDetector.detect('fidelity_bank.csv')
        self.assertEqual(result, 'fidelity')

    def test_returns_unknown_for_unrecognized(self):
        result = BankDetector.detect('random_file.pdf', 'some random content')
        self.assertEqual(result, 'unknown')

    def test_case_insensitive(self):
        result = BankDetector.detect('GCB_STATEMENT.PDF')
        self.assertEqual(result, 'gcb')