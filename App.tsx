import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from '@expo-google-fonts/noto-serif-tc';
import {
  NotoSerifTC_600SemiBold,
} from '@expo-google-fonts/noto-serif-tc';
import {
  NotoSansTC_400Regular,
  NotoSansTC_500Medium,
  NotoSansTC_700Bold,
} from '@expo-google-fonts/noto-sans-tc';
import {
  SpaceMono_400Regular,
} from '@expo-google-fonts/space-mono';
import { TabNavigator } from './src/navigation/TabNavigator';
import { Colors } from './src/theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    NotoSerifTC_600SemiBold,
    NotoSansTC_400Regular,
    NotoSansTC_500Medium,
    NotoSansTC_700Bold,
    SpaceMono_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.brand} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
