import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';

export default function HomeScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data.products);
      setFeatured(data.products.slice(0, 4));
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
    >
      <View style={styles.productHeader}>
        <Text style={styles.flag}>{item.flag}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>POPULAIRE</Text>
        </View>
      </View>
      <Text style={styles.productName}>{item.country}</Text>
      <Text style={styles.productNetwork}>{item.network}</Text>
      <View style={styles.productFooter}>
        <View>
          <Text style={styles.productPrice}>{item.price}€</Text>
          <Text style={styles.productData}>{item.data} / {item.days} jours</Text>
        </View>
        <TouchableOpacity style={styles.buyButton}>
          <Icon name="cart-plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logoText}>⚡ E-SIM</Text>
          <Text style={styles.logoSubtitle}>BY ELECTRON</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Icon name="bell-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une destination..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction}>
          <Icon name="earth" size={28} color="#667eea" />
          <Text style={styles.quickActionText}>Europe</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Icon name="airplane" size={28} color="#4facfe" />
          <Text style={styles.quickActionText}>Amériques</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Icon name="island" size={28} color="#fa709a" />
          <Text style={styles.quickActionText}>Asie</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Icon name="weather-sunny" size={28} color="#fee140" />
          <Text style={styles.quickActionText}>Afrique</Text>
        </TouchableOpacity>
      </View>

      {/* Featured */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌍 Destinations Populaires</Text>
        <FlatList
          data={featured}
          renderItem={renderProduct}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productsList}
        />
      </View>

      {/* All Products */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✨ Tous les forfaits</Text>
        <View style={styles.productsGrid}>
          {products.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.gridProduct}
              onPress={() => navigation.navigate('ProductDetail', { product: item })}
            >
              <Text style={styles.flag}>{item.flag}</Text>
              <Text style={styles.gridProductName}>{item.country}</Text>
              <Text style={styles.gridProductPrice}>{item.price}€</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* CTA */}
      <TouchableOpacity style={styles.ctaButton}>
        <Icon name="whatsapp" size={20} color="#fff" />
        <Text style={styles.ctaText}>Need help? Chat with us!</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#667eea',
  },
  logoSubtitle: {
    fontSize: 10,
    color: '#999',
    letterSpacing: 2,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1f3a',
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#fff',
    fontSize: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionText: {
    color: '#fff',
    marginTop: 5,
    fontSize: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  productsList: {
    paddingHorizontal: 20,
  },
  productCard: {
    width: 200,
    backgroundColor: '#1a1f3a',
    borderRadius: 20,
    padding: 15,
    marginRight: 15,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  flag: {
    fontSize: 32,
  },
  badge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  productName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  productNetwork: {
    color: '#999',
    fontSize: 12,
    marginBottom: 10,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    color: '#667eea',
    fontSize: 22,
    fontWeight: '800',
  },
  productData: {
    color: '#999',
    fontSize: 12,
  },
  buyButton: {
    backgroundColor: '#667eea',
    width: 45,
    height: 45,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
  },
  gridProduct: {
    width: '30%',
    backgroundColor: '#1a1f3a',
    borderRadius: 15,
    padding: 15,
    margin: 5,
    alignItems: 'center',
  },
  gridProductName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 5,
    textAlign: 'center',
  },
  gridProductPrice: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 5,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25d366',
    margin: 20,
    padding: 15,
    borderRadius: 15,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 10,
  },
});