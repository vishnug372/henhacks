import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

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

export default function ProfileScreen() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // ─── Fetch Listings (Real-time) ────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'listings'),
      where('seller_id', '==', user.sub),
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
        setRefreshing(false);
      },
      (error) => {
        console.error('Firestore listener error:', error);
        setIsLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // ─── Pull to Refresh ──────────────────────────────────────────
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // onSnapshot handles the refresh automatically,
    // just toggle the indicator briefly
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // ─── Mark as Sold ──────────────────────────────────────────────
  const handleMarkSold = (listing: Listing) => {
    Alert.alert(
      'Mark as Sold?',
      `"${listing.title}" will be removed from the board.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sold!',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'listings', listing.id), {
                status: 'sold',
              });
            } catch (err) {
              console.error('Error marking sold:', err);
              Alert.alert('Error', 'Could not update listing.');
            }
          },
        },
      ]
    );
  };

  // ─── Delete Listing ────────────────────────────────────────────
  const handleDelete = (listing: Listing) => {
    Alert.alert(
      'Delete Listing?',
      `"${listing.title}" will be gone for good, partner.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'listings', listing.id));
            } catch (err) {
              console.error('Error deleting:', err);
              Alert.alert('Error', 'Could not delete listing.');
            }
          },
        },
      ]
    );
  };

  // ─── Format Price ──────────────────────────────────────────────
  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  // ─── Format Date ───────────────────────────────────────────────
  const formatDate = (timestamp: any): string => {
    if (!timestamp?.toDate) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // ─── Render ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B6914"
          />
        }
      >
        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={36} color="#8B6914" />
          </View>
          <Text style={styles.heading}>🤠 Your Ranch</Text>
          <Text style={styles.subheading}>
            {listings.length} active {listings.length === 1 ? 'listing' : 'listings'}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* ── Loading ── */}
        {isLoading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#8B6914" />
            <Text style={styles.loadingText}>Roundin' up your listings...</Text>
          </View>
        )}

        {/* ── Empty State ── */}
        {!isLoading && listings.length === 0 && (
          <View style={styles.centered}>
            <Ionicons name="storefront-outline" size={64} color="#C4A265" />
            <Text style={styles.emptyTitle}>No bounties posted yet</Text>
            <Text style={styles.emptySubtitle}>
              Head to the "Sell" tab to list your first item
            </Text>
          </View>
        )}

        {/* ── Listings ── */}
        {listings.map((listing) => (
          <View key={listing.id} style={styles.card}>
            {/* Image */}
            {listing.images && listing.images.length > 0 ? (
              <Image
                source={{ uri: listing.images[0] }}
                style={styles.cardImage}
              />
            ) : (
              <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                <Ionicons name="image-outline" size={32} color="#C4A265" />
              </View>
            )}

            {/* Info */}
            <View style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {listing.title}
                </Text>
                <Text style={styles.cardPrice}>{formatPrice(listing.price)}</Text>
              </View>

              {listing.description ? (
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {listing.description}
                </Text>
              ) : null}

              <Text style={styles.cardDate}>
                Posted {formatDate(listing.created_at)}
              </Text>

              {/* Actions */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.soldBtn}
                  onPress={() => handleMarkSold(listing)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color="#FFF8E7" />
                  <Text style={styles.soldBtnText}>Mark Sold</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(listing)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={16} color="#8B0000" />
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        <Text style={styles.footer}>— UD Trading Post —</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },

  // Header
  headerRow: {
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FDF1D6',
    borderWidth: 2,
    borderColor: '#C4A265',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#3B2A1A',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  subheading: {
    fontSize: 14,
    color: '#8B6914',
    fontStyle: 'italic',
    marginTop: 4,
  },
  divider: {
    height: 2,
    backgroundColor: '#C4A265',
    marginVertical: 16,
    borderRadius: 1,
  },

  // Loading & Empty
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8B6914',
    fontStyle: 'italic',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B2A1A',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#A0896B',
    marginTop: 6,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Card
  card: {
    backgroundColor: '#FDF1D6',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#C4A265',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#3B2A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#FDF1D6',
  },
  cardImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#3B2A1A',
    flex: 1,
    marginRight: 10,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#8B6914',
  },
  cardDescription: {
    fontSize: 14,
    color: '#5C4A32',
    marginBottom: 8,
    lineHeight: 20,
  },
  cardDate: {
    fontSize: 12,
    color: '#A0896B',
    fontStyle: 'italic',
    marginBottom: 12,
  },

  // Actions
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  soldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B6914',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    gap: 6,
  },
  soldBtnText: {
    color: '#FFF8E7',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#8B0000',
    gap: 6,
  },
  deleteBtnText: {
    color: '#8B0000',
    fontSize: 13,
    fontWeight: '700',
  },

  // Footer
  footer: {
    textAlign: 'center',
    color: '#C4A265',
    fontSize: 13,
    marginTop: 24,
    fontStyle: 'italic',
    letterSpacing: 2,
  },
});