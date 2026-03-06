import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { marketplaceApi } from '../services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

// Product card component
const ProductCard = ({ product }: { product: any }) => (
  <TouchableOpacity style={styles.productCard}>
    <Image
      source={{ uri: product.images?.[0] || 'https://images.unsplash.com/photo-1518732714860-b62714ce0c59?w=400' }}
      style={styles.productImage}
      resizeMode="cover"
    />
    
    {product.is_featured && (
      <View style={styles.featuredBadge}>
        <Icon name="star" size={10} color="white" />
        <Text style={styles.featuredText}>TOP</Text>
      </View>
    )}
    
    <View style={styles.productInfo}>
      <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
      <Text style={styles.productPrice}>{product.price?.toLocaleString()} XPF</Text>
      
      <View style={styles.sellerRow}>
        <Image
          source={{ uri: product.seller?.picture || `https://ui-avatars.com/api/?name=${product.seller?.name}&background=FF6B35&color=fff&size=32` }}
          style={styles.sellerAvatar}
        />
        <Text style={styles.sellerName} numberOfLines={1}>{product.seller?.name}</Text>
        {product.seller?.is_verified && (
          <View style={styles.verifiedBadge}>
            <Icon name="check" size={8} color="white" />
          </View>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

// Category item component
const CategoryItem = ({ category, isActive, onPress }: { category: any; isActive: boolean; onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.categoryItem, isActive && styles.categoryItemActive]}
    onPress={onPress}
  >
    <View style={[styles.categoryIcon, isActive && styles.categoryIconActive]}>
      <Icon 
        name={category.icon} 
        size={20} 
        color={isActive ? 'white' : '#1A1A2E'} 
      />
    </View>
    <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>
      {category.name}
    </Text>
  </TouchableOpacity>
);

// Main Marketplace Screen
const MarketplaceScreen = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'all', name: 'Tous', icon: 'grid' },
    { id: 'crafts', name: 'Artisanat', icon: 'scissors' },
    { id: 'jewelry', name: 'Bijoux', icon: 'droplet' },
    { id: 'food', name: 'Cuisine', icon: 'coffee' },
    { id: 'clothing', name: 'Mode', icon: 'shopping-bag' },
    { id: 'beauty', name: 'Beauté', icon: 'heart' },
    { id: 'services', name: 'Services', icon: 'briefcase' }
  ];

  // Mock products
  const mockProducts = [
    {
      product_id: '1',
      name: 'Perles noires de Rangiroa',
      price: 45000,
      images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400'],
      seller: { name: 'Perles Noires PF', is_verified: true },
      category: 'jewelry',
      is_featured: true
    },
    {
      product_id: '2',
      name: 'Huile de Monoï traditionnelle',
      price: 2500,
      images: ['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400'],
      seller: { name: 'Maeva Bio', is_verified: false },
      category: 'beauty'
    },
    {
      product_id: '3',
      name: 'Paréo tahitien fait main',
      price: 8500,
      images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400'],
      seller: { name: 'Tifaifai Art', is_verified: true },
      category: 'clothing'
    },
    {
      product_id: '4',
      name: 'Ukulélé artisanal',
      price: 35000,
      images: ['https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400'],
      seller: { name: 'Mana Instruments', is_verified: false },
      category: 'crafts'
    },
    {
      product_id: '5',
      name: 'Confiture de coco',
      price: 1800,
      images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400'],
      seller: { name: 'Saveurs du Fenua', is_verified: true },
      category: 'food'
    },
    {
      product_id: '6',
      name: 'Collier en nacre sculptée',
      price: 15000,
      images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400'],
      seller: { name: 'Nacre Design', is_verified: true },
      category: 'jewelry',
      is_featured: true
    }
  ];

  useEffect(() => {
    fetchProducts();
  }, [activeCategory]);

  const fetchProducts = async () => {
    try {
      const params = activeCategory !== 'all' ? { category: activeCategory } : {};
      const response = await marketplaceApi.getProducts(params);
      const fetchedProducts = response.data.products || [];
      setProducts(fetchedProducts.length > 0 ? fetchedProducts : mockProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts(mockProducts);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B35"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Marketplace</Text>
          <TouchableOpacity style={styles.sellBtn}>
            <LinearGradient
              colors={['#FF6B35', '#FF1493']}
              style={styles.sellGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Icon name="plus" size={18} color="white" />
              <Text style={styles.sellText}>Vendre</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Icon name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un produit..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="x" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Icon name="sliders" size={20} color="#1A1A2E" />
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              isActive={activeCategory === category.id}
              onPress={() => setActiveCategory(category.id)}
            />
          ))}
        </ScrollView>

        {/* Products Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="shopping-bag" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Aucun produit trouvé</Text>
            <Text style={styles.emptySubtext}>Essayez une autre catégorie</Text>
          </View>
        ) : (
          <View style={styles.productsContainer}>
            <View style={styles.productsHeader}>
              <Text style={styles.productsCount}>
                {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.productsGrid}>
              {filteredProducts.map((product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E6'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A2E'
  },
  sellBtn: {
    borderRadius: 20,
    overflow: 'hidden'
  },
  sellGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6
  },
  sellText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 10
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A2E',
    marginLeft: 10
  },
  filterBtn: {
    width: 48,
    height: 48,
    backgroundColor: 'white',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  categoriesContainer: {
    marginBottom: 16
  },
  categoriesContent: {
    paddingHorizontal: 16
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 16
  },
  categoryItemActive: {},
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6
  },
  categoryIconActive: {
    backgroundColor: '#FF6B35'
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A2E'
  },
  categoryLabelActive: {
    color: '#FF6B35'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60
  },
  loadingText: {
    fontSize: 16,
    color: '#666'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E'
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center'
  },
  productsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100
  },
  productsHeader: {
    marginBottom: 12
  },
  productsCount: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500'
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12
  },
  productImage: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: '#F3F4F6'
  },
  featuredBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4
  },
  featuredText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800'
  },
  productInfo: {
    padding: 12
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 4,
    lineHeight: 18
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FF6B35',
    marginBottom: 8
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  sellerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 6,
    marginRight: 6
  },
  sellerName: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1
  },
  verifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00CED1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4
  }
});

export default MarketplaceScreen;
