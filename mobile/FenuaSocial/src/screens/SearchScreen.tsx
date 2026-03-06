import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { searchApi } from '../services/api';

type SearchTab = 'all' | 'users' | 'posts' | 'products';

// Search result item
const SearchResultItem = ({ item, type }: { item: any; type: string }) => {
  if (type === 'users' || item.type === 'user') {
    return (
      <TouchableOpacity style={styles.userResult}>
        <Image
          source={{ uri: item.picture || `https://ui-avatars.com/api/?name=${item.name}&background=FF6B35&color=fff` }}
          style={styles.userAvatar}
        />
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName}>{item.name}</Text>
            {item.is_verified && (
              <View style={styles.verifiedBadge}>
                <Icon name="check" size={10} color="white" />
              </View>
            )}
          </View>
          <Text style={styles.userHandle}>@{item.name?.toLowerCase().replace(/\s/g, '')}</Text>
        </View>
        <TouchableOpacity style={styles.followBtn}>
          <Text style={styles.followBtnText}>Suivre</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  if (type === 'products' || item.type === 'product') {
    return (
      <TouchableOpacity style={styles.productResult}>
        <Image
          source={{ uri: item.image || 'https://images.unsplash.com/photo-1518732714860-b62714ce0c59?w=100' }}
          style={styles.productImage}
        />
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.productPrice}>{item.price?.toLocaleString()} XPF</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Default: post result
  return (
    <TouchableOpacity style={styles.postResult}>
      <Image
        source={{ uri: item.media_url || 'https://images.unsplash.com/photo-1589519160732-57fc498494f8?w=100' }}
        style={styles.postThumbnail}
      />
    </TouchableOpacity>
  );
};

// Tab button
const TabButton = ({ label, isActive, onPress }: { label: string; isActive: boolean; onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.tabBtn, isActive && styles.tabBtnActive]}
    onPress={onPress}
  >
    <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>{label}</Text>
  </TouchableOpacity>
);

// Main Search Screen
const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock trending searches
  const trendingSearches = [
    'Heiva 2024', 'Perles noires', 'Moorea', 'Poisson cru', 'Ukulélé', 'Tattoo polynésien'
  ];

  // Mock suggestions
  const mockSuggestions = [
    { type: 'user', name: 'Maeva Tahiti', is_verified: true },
    { type: 'user', name: 'Mana Band', is_verified: true },
    { type: 'user', name: 'Perles Noires PF', is_verified: false },
    { type: 'product', name: 'Perles de Rangiroa', price: 45000, image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100' },
    { type: 'product', name: 'Huile de Monoï', price: 2500, image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=100' }
  ];

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await searchApi.search({ q: query, type: activeTab });
      setResults(response.data.results || mockSuggestions);
    } catch (error) {
      console.error('Search error:', error);
      setResults(mockSuggestions.filter(s => 
        s.name?.toLowerCase().includes(query.toLowerCase())
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setResults([]); }}>
              <Icon name="x" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TabButton label="Tous" isActive={activeTab === 'all'} onPress={() => setActiveTab('all')} />
        <TabButton label="Comptes" isActive={activeTab === 'users'} onPress={() => setActiveTab('users')} />
        <TabButton label="Posts" isActive={activeTab === 'posts'} onPress={() => setActiveTab('posts')} />
        <TabButton label="Produits" isActive={activeTab === 'products'} onPress={() => setActiveTab('products')} />
      </View>

      {searchQuery.length === 0 ? (
        // Trending section
        <View style={styles.trendingSection}>
          <Text style={styles.sectionTitle}>Tendances</Text>
          <View style={styles.trendingTags}>
            {trendingSearches.map((term, index) => (
              <TouchableOpacity
                key={index}
                style={styles.trendingTag}
                onPress={() => handleSearch(term)}
              >
                <Icon name="trending-up" size={14} color="#FF6B35" />
                <Text style={styles.trendingText}>{term}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Suggestions</Text>
          <FlatList
            data={mockSuggestions}
            keyExtractor={(item, index) => `suggestion-${index}`}
            renderItem={({ item }) => <SearchResultItem item={item} type={item.type} />}
            scrollEnabled={false}
          />
        </View>
      ) : (
        // Search results
        <FlatList
          data={results}
          keyExtractor={(item, index) => `result-${index}`}
          renderItem={({ item }) => <SearchResultItem item={item} type={activeTab} />}
          numColumns={activeTab === 'posts' ? 3 : 1}
          key={activeTab === 'posts' ? 'grid' : 'list'}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="search" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                {loading ? 'Recherche en cours...' : 'Aucun résultat trouvé'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E6'
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A2E',
    marginLeft: 10
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white'
  },
  tabBtnActive: {
    backgroundColor: '#1A1A2E'
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E'
  },
  tabBtnTextActive: {
    color: 'white'
  },
  trendingSection: {
    paddingHorizontal: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12
  },
  trendingTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  trendingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6
  },
  trendingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A2E'
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingBottom: 100
  },
  userResult: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F3F4F6'
  },
  userInfo: {
    flex: 1,
    marginLeft: 12
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E'
  },
  verifiedBadge: {
    marginLeft: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00CED1',
    justifyContent: 'center',
    alignItems: 'center'
  },
  userHandle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2
  },
  followBtn: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12
  },
  followBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700'
  },
  productResult: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F3F4F6'
  },
  productInfo: {
    flex: 1,
    marginLeft: 12
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E'
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FF6B35',
    marginTop: 4
  },
  postResult: {
    flex: 1/3,
    aspectRatio: 1,
    padding: 1
  },
  postThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF'
  }
});

export default SearchScreen;
