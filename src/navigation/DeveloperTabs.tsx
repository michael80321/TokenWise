import React from 'react';
import { StyleSheet } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../theme';
import { ModelComparisonScreen } from '../screens/developer/ModelComparisonScreen';
import { TokenCalculatorScreen } from '../screens/developer/TokenCalculatorScreen';
import { ScenarioScreen } from '../screens/developer/ScenarioScreen';
import { AlternativeScreen } from '../screens/developer/AlternativeScreen';

const Tab = createMaterialTopTabNavigator();

export function DeveloperTabs() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          tabBarActiveTintColor: Colors.brandDark,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarIndicatorStyle: styles.indicator,
          tabBarPressColor: Colors.brandLight,
          lazy: true,
        }}
      >
        <Tab.Screen name="模型比較" component={ModelComparisonScreen} />
        <Tab.Screen name="成本計算" component={TokenCalculatorScreen} />
        <Tab.Screen name="場景選型" component={ScenarioScreen} />
        <Tab.Screen name="替代建議" component={AlternativeScreen} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontFamily: Typography.bodyMediumFamily,
    fontSize: Typography.sizes.sm,
    textTransform: 'none',
    letterSpacing: 0,
  },
  indicator: {
    backgroundColor: Colors.brand,
    height: 2,
    borderRadius: 1,
  },
});
