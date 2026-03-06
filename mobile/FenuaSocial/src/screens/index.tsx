// Placeholder screens for React Native app
// These will be fully implemented based on the web version

import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';

// Feed Screen
export const FeedScreen = () => (
  <SafeAreaView style={styles.container}>
    <ScrollView>
      <View style={styles.header}>
        <Text style={styles.title}>Accueil</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.placeholder}>Feed avec posts, stories et réactions</Text>
      </View>
    </ScrollView>
  </SafeAreaView>
);

// Reels Screen
export const ReelsScreen = () => (
  <View style={[styles.container, styles.dark]}>
    <Text style={styles.whiteText}>Reels - Vidéos courtes</Text>
  </View>
);

// Live Screen
export const LiveScreen = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.title}>Lives en Direct</Text>
    </View>
    <View style={styles.content}>
      <Text style={styles.placeholder}>Liste des lives en cours</Text>
    </View>
  </SafeAreaView>
);

// Create Screen
export const CreateScreen = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.title}>Créer</Text>
    </View>
    <View style={styles.content}>
      <Text style={styles.placeholder}>Créer un post, story, reel ou live</Text>
    </View>
  </SafeAreaView>
);

// Marketplace Screen
export const MarketplaceScreen = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.title}>Marketplace</Text>
    </View>
    <View style={styles.content}>
      <Text style={styles.placeholder}>Produits et services locaux</Text>
    </View>
  </SafeAreaView>
);

// Profile Screen
export const ProfileScreen = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.title}>Profil</Text>
    </View>
    <View style={styles.content}>
      <Text style={styles.placeholder}>Votre profil et publications</Text>
    </View>
  </SafeAreaView>
);

// Chat Screen
export const ChatScreen = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.title}>Messages</Text>
    </View>
    <View style={styles.content}>
      <Text style={styles.placeholder}>Vos conversations</Text>
    </View>
  </SafeAreaView>
);

// Search Screen
export const SearchScreen = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.title}>Recherche</Text>
    </View>
    <View style={styles.content}>
      <Text style={styles.placeholder}>Rechercher sur Fenua Social</Text>
    </View>
  </SafeAreaView>
);

// Notifications Screen
export const NotificationsScreen = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.title}>Notifications</Text>
    </View>
    <View style={styles.content}>
      <Text style={styles.placeholder}>Vos notifications</Text>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E6'
  },
  dark: {
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    padding: 20,
    paddingTop: 10
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A2E'
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  placeholder: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  whiteText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600'
  }
});

export default {
  FeedScreen,
  ReelsScreen,
  LiveScreen,
  CreateScreen,
  MarketplaceScreen,
  ProfileScreen,
  ChatScreen,
  SearchScreen,
  NotificationsScreen
};
