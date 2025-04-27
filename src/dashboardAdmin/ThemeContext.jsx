import { createContext, useState } from 'react';
import PropTypes from 'prop-types';
export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
  
};
ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
