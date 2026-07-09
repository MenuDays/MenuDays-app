const tintColorLight = '#FFA726'; // tu primary
const tintColorDark = '#FFB74D';  // tu primaryLight, se ve mejor sobre fondo oscuro

export default {
  light: {
    text: '#3E2723',
    textSecondary: '#757575',
    background: '#FFFFFF',
    tint: tintColorLight,
    primary: '#FFA726',
    primaryDark: '#FB8C00',
    primaryLight: '#FFB74D',
    placeholder: '#9E9E9E',
    border: '#E0E0E0',
    success: '#4CAF50',
    error: '#F44336',
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#BDBDBD',
    background: '#121212',
    tint: tintColorDark,
    primary: '#FFA726',
    primaryDark: '#FB8C00',
    primaryLight: '#FFB74D',
    placeholder: '#9E9E9E',
    border: '#3A3A3A',
    success: '#4CAF50',
    error: '#F44336',
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
  },
};