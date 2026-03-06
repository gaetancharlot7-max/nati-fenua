import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ScrollView
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';

const { width, height } = Dimensions.get('window');

const LandingScreen = ({ navigation }: any) => {
  const features = [
    { icon: 'camera', title: 'Photos & Stories', color: '#FF6B35' },
    { icon: 'film', title: 'Reels & Vidéos', color: '#FF1493' },
    { icon: 'radio', title: 'Lives en Direct', color: '#9400D3' },
    { icon: 'message-circle', title: 'Messagerie', color: '#00CED1' },
    { icon: 'shopping-bag', title: 'Marketplace', color: '#FFD700' },
    { icon: 'users', title: 'Communauté', color: '#32CD32' }
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#1A1A2E']}
        style={styles.background}
      >
        {/* Gradient Orbs */}
        <View style={[styles.orb, styles.orbOrange]} />
        <View style={[styles.orb, styles.orbCyan]} />
        <View style={[styles.orb, styles.orbPink]} />

        <ScrollView contentContainerStyle={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#FF6B35', '#FF1493', '#9400D3']}
              style={styles.logo}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.logoInner}>
                <Text style={styles.logoText}>F</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            <Text style={styles.titleGradient}>Fenua</Text>
            {' '}
            <Text style={styles.titleWhite}>Social</Text>
          </Text>

          <Text style={styles.subtitle}>
            Le réseau social de la{'\n'}
            <Text style={styles.gold}>Polynésie Française</Text>
          </Text>

          <Text style={styles.tagline}>
            Photos • Vidéos • Stories • Reels • Lives • Marketplace
          </Text>

          {/* Features Grid */}
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                  <Icon name={feature.icon} size={24} color={feature.color} />
                </View>
                <Text style={styles.featureText}>{feature.title}</Text>
              </View>
            ))}
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Auth')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF6B35', '#FF1493']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>Commencer Gratuit</Text>
              <Icon name="arrow-right" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Auth')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  background: {
    flex: 1
  },
  orb: {
    position: 'absolute',
    borderRadius: 200,
    opacity: 0.3
  },
  orbOrange: {
    width: 300,
    height: 300,
    backgroundColor: '#FF6B35',
    top: height * 0.1,
    left: -100,
    filter: 'blur(100px)'
  },
  orbCyan: {
    width: 300,
    height: 300,
    backgroundColor: '#00CED1',
    bottom: height * 0.2,
    right: -100
  },
  orbPink: {
    width: 400,
    height: 400,
    backgroundColor: '#FF1493',
    top: height * 0.4,
    left: width * 0.3,
    opacity: 0.15
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40
  },
  logoContainer: {
    marginBottom: 24
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 28,
    padding: 4,
    transform: [{ rotate: '6deg' }]
  },
  logoInner: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FF6B35'
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 8
  },
  titleGradient: {
    color: '#FF6B35'
  },
  titleWhite: {
    color: 'white'
  },
  subtitle: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 8
  },
  gold: {
    color: '#FFD700',
    fontWeight: '600'
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 32
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 12
  },
  featureItem: {
    alignItems: 'center',
    width: (width - 72) / 3
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  featureText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
    textAlign: 'center'
  },
  primaryButton: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700'
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600'
  }
});

export default LandingScreen;
