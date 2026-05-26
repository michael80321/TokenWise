import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform } from 'react-native';
import { Colors, Typography, Spacing } from '../theme';
import { Text } from '../components/Text';
import { DeveloperTabs } from './DeveloperTabs';
import { DailyScreen } from '../screens/daily';

const Tab = createBottomTabNavigator();

function TabIcon({ focused, label, emoji }: { focused: boolean; label: string; emoji: string }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.emoji, focused ? styles.emojiActive : {}]}>{emoji}</Text>
      <Text
        variant="caption"
        color={focused ? Colors.tabActive : Colors.tabInactive}
        style={focused ? styles.tabLabelActive : styles.tabLabelInactive}
      >
        {label}
      </Text>
    </View>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: Colors.tabBarBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Daily"
        component={DailyScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="日常" emoji="✦" />
          ),
        }}
      />
      <Tab.Screen
        name="Developer"
        component={DeveloperTabs}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="開發者" emoji="⚙" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    gap: 2,
  },
  emoji: {
    fontSize: 20,
    color: Colors.tabInactive,
  },
  emojiActive: {
    color: Colors.tabActive,
  },
  tabLabelActive: {
    fontFamily: Typography.bodyMediumFamily,
    color: Colors.tabActive,
  },
  tabLabelInactive: {},
});
