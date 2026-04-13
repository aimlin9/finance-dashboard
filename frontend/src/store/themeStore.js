import { create } from 'zustand';

var useThemeStore = create(function(set) {
  var saved = localStorage.getItem('theme') || 'dark';
  if (saved === 'light') {
    document.documentElement.classList.add('light');
  }

  return {
    theme: saved,

    toggleTheme: function() {
      set(function(state) {
        var newTheme = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'light') {
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
        }
        return { theme: newTheme };
      });
    },
  };
});

export default useThemeStore;
