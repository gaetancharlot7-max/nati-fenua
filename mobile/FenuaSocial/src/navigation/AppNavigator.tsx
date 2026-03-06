import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../contexts/AuthContext';

// Screens
import LandingScreen from '../screens/LandingScreen';
import AuthScreen from '../screens/AuthScreen';
import FeedScreen from '../screens/FeedScreen';
import ReelsScreen from '../screens/ReelsScreen';
import LiveScreen from '../screens/LiveScreen';
import CreateScreen from '../screens/CreateScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatScreen from '../screens/ChatScreen';
import SearchScreen from '../screens/SearchScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

export type RootStackParamList = {
  Main: undefined;
  Chat: undefined;
  Search: undefined;
  Notifications: undefined;
  AuthStack: undefined;
  Landing: undefined;
  Auth: undefined;
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Bar Button for Create
const CreateTabButton = ({ onPress }: { onPress?: () => void }) => (
  <View style={styles.createButtonContainer}>
    <LinearGradient
      colors={['#FF6B35', '#FF1493', '#9400D3']}
      style={styles.createButton}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Icon name="plus" size={28} color="white" />
    </LinearGradient>
  </View>
);

// Main Tab Navigator
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#1A1A2E',
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel
      }}
    >
      <Tab.Screen 
        name="Feed" 
        component={FeedScreen}
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} />
        }}
      />
      <Tab.Screen 
        name="Reels" 
        component={ReelsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="film" size={size} color={color} />
        }}
      />
      <Tab.Screen 
        name="Create" 
        component={CreateScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: () => null,
          tabBarButton: (props) => <CreateTabButton {...props} />
        }}
      />
      <Tab.Screen 
        name="Live" 
        component={LiveScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View>
              <Icon name="radio" size={size} color={color} />
              <View style={styles.liveDot} />
            </View>
          )
        }}
      />
      <Tab.Screen 
        name="Marché" 
        component={MarketplaceScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="shopping-bag" size={size} color={color} />
        }}
      />
      <Tab.Screen 
        name="Profil" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="user" size={size} color={color} />
        }}
      />
    </Tab.Navigator>
  );
};

// Auth Stack
const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
    </Stack.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
        </>
      ) : (
        <Stack.Screen name="AuthStack" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5E6'
  },
  tabBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 0,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    height: 85,
    paddingBottom: 25,
    paddingTop: 10
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600'
  },
  createButtonContainer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  createButton: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    transform: [{ rotate: '3deg' }]
  },
  liveDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000'
  }
});

export default AppNavigator;
