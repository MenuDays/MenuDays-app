import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FavoritosScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Favoritos</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#3E2723' },
});