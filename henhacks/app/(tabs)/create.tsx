import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker, MapPressEvent, MarkerDragStartEndEvent } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// ─── Types ─────────────────────────────────────────────────────
interface Coordinate {
  latitude: number;
  longitude: number;
}

interface Listing {
  title: string;
  description: string;
  price: number;
  images: string[];
  pickup_location: Coordinate;
  status: 'active' | 'sold' | 'deleted';
  created_at: string;
}

// University of Delaware — The Green
const DEFAULT_REGION = {
  latitude: 39.6837,
  longitude: -75.7497,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const MAX_IMAGES = 5;

export default function CreateListingScreen() {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [pinLocation, setPinLocation] = useState<Coordinate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const mapRef = useRef<MapView>(null);

  // ─── Image Picker ──────────────────────────────────────────────
  const pickImage = async (): Promise<void> => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Whoa there, partner', `You can only rustle up ${MAX_IMAGES} photos.`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Hold up!', 'We need access to your photo stash.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.7,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri);
      setImages((prev) => [...prev, ...newImages].slice(0, MAX_IMAGES));
    }
  };

  const removeImage = (index: number): void => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Map Pin ───────────────────────────────────────────────────
  const handleMapPress = (e: MapPressEvent): void => {
    setPinLocation(e.nativeEvent.coordinate);
  };

  const handleMarkerDragEnd = (e: MarkerDragStartEndEvent): void => {
    setPinLocation(e.nativeEvent.coordinate);
  };

  // ─── Validation & Submit ───────────────────────────────────────
  const validate = (): string | null => {
    if (!title.trim()) return 'Every bounty needs a name, partner.';
    if (!price.trim() || isNaN(parseFloat(price))) return 'Set your price in gold coins (or dollars).';
    if (images.length === 0) return 'Snap a photo of your goods.';
    if (!pinLocation) return 'Mark your meetup spot on the map.';
    return null;
  };

  const handleSubmit = async (): Promise<void> => {
    const error = validate();
    if (error) {
      Alert.alert('Not so fast', error);
      return;
    }

    setIsSubmitting(true);

    const listing: Listing = {
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      images,
      pickup_location: {
        latitude: pinLocation!.latitude,
        longitude: pinLocation!.longitude,
      },
      status: 'active',
      created_at: new Date().toISOString(),
    };

    try {
      // ── TODO: Replace with your actual API call ──
      // Supabase:
      //   const { data, error } = await supabase.from('listings').insert(listing);
      // Firebase:
      //   await addDoc(collection(db, 'listings'), listing);

      console.log('Listing to submit:', listing);
      await new Promise<void>((r) => setTimeout(r, 1000));

      Alert.alert('Yeehaw! 🤠', 'Your listing is posted on the board.', [
        { text: 'OK', onPress: () => router.push('/') },
      ]);

      setTitle('');
      setDescription('');
      setPrice('');
      setImages([]);
      setPinLocation(null);
    } catch (err) {
      Alert.alert('Tarnation!', 'Something went wrong. Try again, cowboy.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header ── */}
          <View style={styles.headerRow}>
            <Text style={styles.heading}>📜 Post a Bounty</Text>
            <Text style={styles.subheading}>List your goods at the trading post</Text>
          </View>

          <View style={styles.divider} />

          {/* ── Photos ── */}
          <Text style={styles.label}>🖼️ Photographs</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageRow}
          >
            {images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.imageThumbnail} />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={22} color="#8B0000" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < MAX_IMAGES && (
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                <Ionicons name="camera-outline" size={28} color="#8B6914" />
                <Text style={styles.addImageText}>{images.length}/{MAX_IMAGES}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* ── Title ── */}
          <Text style={styles.label}>🏷️ What're You Sellin'?</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Calculus Textbook, Lasso, Spurs..."
            placeholderTextColor="#A0896B"
            value={title}
            onChangeText={setTitle}
            maxLength={80}
          />

          {/* ── Price ── */}
          <Text style={styles.label}>💰 Your Price</Text>
          <View style={styles.priceRow}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={[styles.input, styles.priceInput]}
              placeholder="0.00"
              placeholderTextColor="#A0896B"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />
          </View>

          {/* ── Description ── */}
          <Text style={styles.label}>📝 The Details</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your wares — condition, story, quirks..."
            placeholderTextColor="#A0896B"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />

          {/* ── Pickup Location Map ── */}
          <Text style={styles.label}>📍 Meetup Spot</Text>
          <Text style={styles.hint}>Tap the map to stake your claim</Text>
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={DEFAULT_REGION}
              onPress={handleMapPress}
            >
              {pinLocation && (
                <Marker
                  coordinate={pinLocation}
                  draggable
                  onDragEnd={handleMarkerDragEnd}
                />
              )}
            </MapView>
          </View>
          {pinLocation && (
            <Text style={styles.pinConfirm}>
              🏴 Spot marked — drag to mosey it around
            </Text>
          )}

          {/* ── Submit ── */}
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF8E7" />
            ) : (
              <Text style={styles.submitBtnText}>🤠 Post to the Board</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.footer}>— UD Trading Post —</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Wild West Palette ─────────────────────────────────────────
// Background:  #FFF8E7 (aged parchment)
// Card/Input:  #FDF1D6 (warm tan)
// Borders:     #C4A265 (dusty gold)
// Text:        #3B2A1A (dark leather brown)
// Accent:      #8B0000 (saloon red)
// Secondary:   #8B6914 (saddle brown)
// Hint:        #A0896B (faded rope)

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  container: {
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
  heading: {
    fontSize: 30,
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

  // Labels
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3B2A1A',
    marginTop: 18,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  hint: {
    fontSize: 13,
    color: '#A0896B',
    marginBottom: 8,
    fontStyle: 'italic',
  },

  // Inputs
  input: {
    borderWidth: 1.5,
    borderColor: '#C4A265',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#3B2A1A',
    backgroundColor: '#FDF1D6',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dollarSign: {
    fontSize: 22,
    fontWeight: '800',
    color: '#8B6914',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
  },

  // Images
  imageRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  imageWrapper: {
    marginRight: 10,
    position: 'relative',
  },
  imageThumbnail: {
    width: 90,
    height: 90,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#C4A265',
    backgroundColor: '#FDF1D6',
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFF8E7',
    borderRadius: 11,
  },
  addImageBtn: {
    width: 90,
    height: 90,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#C4A265',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDF1D6',
  },
  addImageText: {
    fontSize: 12,
    color: '#8B6914',
    marginTop: 2,
    fontWeight: '600',
  },

  // Map
  mapContainer: {
    height: 220,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#C4A265',
  },
  map: {
    flex: 1,
  },
  pinConfirm: {
    fontSize: 13,
    color: '#8B6914',
    marginTop: 6,
    fontStyle: 'italic',
  },

  // Submit
  submitBtn: {
    backgroundColor: '#8B0000',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 28,
    borderWidth: 2,
    borderColor: '#5C0000',
    shadowColor: '#3B2A1A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFF8E7',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
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