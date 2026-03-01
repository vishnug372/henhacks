import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

// ─── Types ─────────────────────────────────────────────────────
interface Coordinate {
  latitude: number;
  longitude: number;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  pickup_location: Coordinate;
  status: 'active' | 'sold' | 'deleted';
  created_at: any;
}

// University of Delaware — The Green
const DEFAULT_REGION: Region = {
  latitude: 39.6837,
  longitude: -75.7497,
  latitudeDelta: 0.015,
  longitudeDelta: 0.015,
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SearchScreen() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const mapRef = useRef<MapView>(null);
  const scrollRef = useRef<ScrollView>(null);

  // ─── Fetch All Active Listings (Real-time) ─────────────────────
  useEffect(() => {
    const q = query(
      collection(db, 'listings'),
      where('status', '==', 'active'),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: Listing[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Listing[];
        setListings(items);
        setIsLoading(false);
      },
      (error) => {
        console.error('Firestore listener error:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ─── Filter by Search Text ─────────────────────────────────────
  const filteredListings = listings.filter((listing) => {
    if (!searchText.trim()) return true;
    const search = searchText.toLowerCase();
    return (
      listing.title.toLowerCase().includes(search) ||
      listing.description?.toLowerCase().includes(search)
    );
  });

  // ─── Handle Pin Press ──────────────────────────────────────────
  const handleMarkerPress = (listing: Listing) => {
    setSelectedListing(listing.id);
    // Find index in filtered list to scroll to the card
    const index = filteredListings.findIndex((l) => l.id === listing.id);
    if (index !== -1 && scrollRef.current) {
      scrollRef.current.scrollTo({
        x: index * (SCREEN_WIDTH * 0.75 + 12),
        animated: true,
      });
    }
  };

  // ─── Handle Card Press → Zoom Map ──────────────────────────────
  const handleCardPress = (listing: Listing) => {
    setSelectedListing(listing.id);
    if (listing.pickup_location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: listing.pickup_location.latitude,
          longitude: listing.pickup_location.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
    }
  };

  // ─── Format Price ──────────────────────────────────────────────
  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  // ─── Render ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* ── Search Bar ── */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#8B6914" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search the trading post..."
              placeholderTextColor="#A0896B"
              value={searchText}
              onChangeText={setSearchText}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color="#C4A265" />
              </TouchableOpacity>
            )}
          </View>

          {/* ── Search Dropdown ── */}
          {showDropdown && searchText.trim().length > 0 && filteredListings.length > 0 && (
            <View style={styles.dropdown}>
              {filteredListings.slice(0, 6).map((listing) => (
                <TouchableOpacity
                  key={listing.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setShowDropdown(false);
                    handleCardPress(listing);
                    const index = filteredListings.findIndex((l) => l.id === listing.id);
                    if (index !== -1 && scrollRef.current) {
                      scrollRef.current.scrollTo({ x: index * (SCREEN_WIDTH * 0.75 + 12), animated: true });
                    }
                  }}
                >
                  <Ionicons name="pricetag-outline" size={15} color="#8B6914" />
                  <View style={styles.dropdownItemText}>
                    <Text style={styles.dropdownTitle} numberOfLines={1}>{listing.title}</Text>
                    <Text style={styles.dropdownPrice}>${listing.price.toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Map ── */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={DEFAULT_REGION}
          >
            {filteredListings.map((listing) =>
              listing.pickup_location ? (
                <Marker
                  key={listing.id}
                  coordinate={listing.pickup_location}
                  title={listing.title}
                  description={formatPrice(listing.price)}
                  onPress={() => handleMarkerPress(listing)}
                  pinColor={selectedListing === listing.id ? '#8B0000' : '#8B6914'}
                />
              ) : null
            )}
          </MapView>

          {/* Result count badge */}
          <View style={styles.resultBadge}>
            <Text style={styles.resultBadgeText}>
              🤠 {filteredListings.length} {filteredListings.length === 1 ? 'bounty' : 'bounties'}
            </Text>
          </View>
        </View>

        {/* ── Loading ── */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#8B6914" />
            <Text style={styles.loadingText}>Scoutin' the land...</Text>
          </View>
        )}

        {/* ── Empty State ── */}
        {!isLoading && filteredListings.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={32} color="#C4A265" />
            <Text style={styles.emptyText}>
              {searchText ? 'No bounties match your search' : 'No bounties posted yet'}
            </Text>
          </View>
        )}

        {/* ── Horizontal Card Carousel ── */}
        {!isLoading && filteredListings.length > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            snapToInterval={SCREEN_WIDTH * 0.75 + 12}
            decelerationRate="fast"
          >
            {filteredListings.map((listing) => (
              <TouchableOpacity
                key={listing.id}
                style={[
                  styles.card,
                  selectedListing === listing.id && styles.cardSelected,
                ]}
                onPress={() => handleCardPress(listing)}
                activeOpacity={0.85}
              >
                {/* Image */}
                {listing.images && listing.images.length > 0 ? (
                  <Image
                    source={{ uri: listing.images[0] }}
                    style={styles.cardImage}
                  />
                ) : (
                  <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                    <Ionicons name="image-outline" size={28} color="#C4A265" />
                  </View>
                )}

                {/* Info */}
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {listing.title}
                  </Text>
                  <Text style={styles.cardPrice}>{formatPrice(listing.price)}</Text>
                  {listing.description ? (
                    <Text style={styles.cardDescription} numberOfLines={1}>
                      {listing.description}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },

  // Search
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF8E7',
    position: 'relative',
    zIndex: 100,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF1D6',
    borderWidth: 1.5,
    borderColor: '#C4A265',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#3B2A1A',
  },

  // Dropdown
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FDF1D6',
    borderWidth: 1.5,
    borderColor: '#C4A265',
    borderRadius: 10,
    zIndex: 100,
    shadowColor: '#3B2A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 10,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8D5AA',
  },
  dropdownItemText: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownTitle: {
    fontSize: 14,
    color: '#3B2A1A',
    fontWeight: '600',
    flex: 1,
  },
  dropdownPrice: {
    fontSize: 13,
    color: '#8B6914',
    fontWeight: '700',
    marginLeft: 8,
  },

  // Map
  mapContainer: {
    flex: 1,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#C4A265',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  resultBadge: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    backgroundColor: '#FDF1D6',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#C4A265',
    shadowColor: '#3B2A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  resultBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B2A1A',
  },

  // Loading
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#8B6914',
    fontStyle: 'italic',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#A0896B',
    fontStyle: 'italic',
  },

  // Carousel
  carouselContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  card: {
    width: SCREEN_WIDTH * 0.75,
    backgroundColor: '#FDF1D6',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#C4A265',
    overflow: 'hidden',
    shadowColor: '#3B2A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardSelected: {
    borderColor: '#8B0000',
    borderWidth: 2.5,
  },
  cardImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#FDF1D6',
  },
  cardImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3B2A1A',
    marginBottom: 2,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#8B6914',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#5C4A32',
  },
});