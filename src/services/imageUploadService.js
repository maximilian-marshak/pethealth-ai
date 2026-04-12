import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { Alert } from 'react-native';
import { supabase } from '../utils/supabase';

/**
 * Запрашивает разрешения на доступ к галерее
 * @returns {Promise<boolean>} - true если разрешение получено
 */
export async function requestPermissions() {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Доступ к галерее',
        'Приложению нужен доступ к вашей галерее для выбора фото',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error requesting permissions:', error);
    return false;
  }
}

/**
 * Открывает галерею для выбора изображения
 * @returns {Promise<string|null>} - URI выбранного изображения или null
 */
export async function pickImage() {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images', // ✅ Исправлено: используем string literal
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      console.log('✅ Image selected:', result.assets[0].uri);
      return result.assets[0].uri;
    }

    console.log('⚠️ Image selection cancelled');
    return null;
  } catch (error) {
    console.error('❌ Error picking image:', error);
    throw error;
  }
}

/**
 * Оптимизирует изображение (сжатие и изменение размера)
 * @param {string} uri - URI исходного изображения
 * @returns {Promise<string>} - URI оптимизированного изображения
 */
export async function optimizeImage(uri) {
  try {
    console.log('🔄 Optimizing image...');
    
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024 } }], // Максимальная ширина 1024px
      {
        compress: 0.7, // Сжатие 70%
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    console.log('✅ Image optimized:', manipulatedImage.uri);
    return manipulatedImage.uri;
  } catch (error) {
    console.error('❌ Error optimizing image:', error);
    throw error;
  }
}

/**
 * Загружает изображение питомца в Supabase Storage
 * @param {string} petId - ID питомца
 * @param {string} localUri - Локальный URI изображения
 * @returns {Promise<string>} - Public URL загруженного изображения
 */
export async function uploadToStorage(petId, localUri) {
  try {
    console.log('📤 Uploading image to storage...');

    // 1. Оптимизируем изображение
    const optimizedUri = await optimizeImage(localUri);

    // 2. Читаем файл как base64
    const base64 = await FileSystem.readAsStringAsync(optimizedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 3. Конвертируем base64 в ArrayBuffer
    const arrayBuffer = decode(base64);

    // 4. Генерируем уникальное имя файла
    const fileExt = localUri.split('.').pop() || 'jpg';
    const fileName = `${petId}_${Date.now()}.${fileExt}`;
    const filePath = `${petId}/${fileName}`;

    console.log('📁 Upload path:', filePath);

    // 5. Загружаем в bucket 'pets'
    const { data, error } = await supabase.storage
      .from('pets')
      .upload(filePath, arrayBuffer, {
        contentType: `image/${fileExt}`,
        upsert: true, // Перезаписываем если файл существует
      });

    if (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }

    console.log('✅ Image uploaded:', data.path);

    // 6. Получаем публичный URL
    const { data: publicUrlData } = supabase.storage
      .from('pets')
      .getPublicUrl(data.path);

    console.log('🔗 Public URL:', publicUrlData.publicUrl);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('❌ Error uploading to storage:', error);
    throw error;
  }
}

/**
 * Удаляет изображение из Supabase Storage
 * @param {string} imageUrl - URL изображения для удаления
 */
export async function deleteFromStorage(imageUrl) {
  try {
    if (!imageUrl || !imageUrl.includes('pets/')) {
      console.log('⚠️ No image to delete or not from storage');
      return;
    }

    // Извлекаем путь файла из URL
    const urlParts = imageUrl.split('pets/');
    if (urlParts.length < 2) {
      console.warn('⚠️ Invalid image URL format');
      return;
    }

    const filePath = urlParts[1];
    console.log('🗑️ Deleting old image:', filePath);

    const { error } = await supabase.storage
      .from('pets')
      .remove([filePath]);

    if (error) {
      console.error('❌ Error deleting image:', error);
      // Не бросаем ошибку, так как это некритично
    } else {
      console.log('✅ Old image deleted');
    }
  } catch (error) {
    console.error('❌ Error in deleteFromStorage:', error);
  }
}

/**
 * Полный процесс: выбор + оптимизация + загрузка изображения питомца
 * @param {string} petId - ID питомца
 * @param {string|null} currentImageUrl - Текущий URL фото (для удаления старого)
 * @returns {Promise<string|null>} - URL нового изображения или null
 */
export async function pickAndUpload(petId, currentImageUrl = null) {
  try {
    // 1. Запрашиваем разрешения
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Ошибка', 'Нет доступа к галерее');
      return null;
    }

    // 2. Выбираем изображение
    const imageUri = await pickImage();
    if (!imageUri) {
      return null;
    }

    // 3. Загружаем новое изображение
    const newImageUrl = await uploadToStorage(petId, imageUri);

    // 4. Удаляем старое изображение (если было)
    if (currentImageUrl) {
      await deleteFromStorage(currentImageUrl);
    }

    return newImageUrl;
  } catch (error) {
    console.error('❌ Error in pickAndUpload:', error);
    Alert.alert('Ошибка', 'Не удалось загрузить фото');
    return null;
  }
}

/**
 * Wrapper для обратной совместимости
 * @deprecated Используйте pickAndUpload вместо этого
 */
export async function pickAndUploadImage(petId, currentImageUrl = null) {
  return pickAndUpload(petId, currentImageUrl);
}

// ==========================================
// 📸 ФУНКЦИИ ДЛЯ АВАТАРОВ ПОЛЬЗОВАТЕЛЕЙ
// ==========================================

/**
 * Загружает аватар пользователя в Supabase Storage
 * @param {string} userId - ID пользователя
 * @param {string} localUri - Локальный URI изображения
 * @returns {Promise<string>} - Public URL загруженного изображения
 */
export async function uploadUserAvatar(userId, localUri) {
  try {
    console.log('📤 Uploading user avatar...');

    // 1. Оптимизируем изображение
    const optimizedUri = await optimizeImage(localUri);

    // 2. Читаем файл как base64
    const base64 = await FileSystem.readAsStringAsync(optimizedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 3. Конвертируем base64 в ArrayBuffer
    const arrayBuffer = decode(base64);

    // 4. Генерируем уникальное имя файла
    const fileExt = localUri.split('.').pop() || 'jpg';
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    console.log('📁 Upload path:', filePath);

    // 5. Загружаем в bucket 'avatars'
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, arrayBuffer, {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }

    console.log('✅ Avatar uploaded:', data.path);

    // 6. Получаем публичный URL
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path);

    console.log('🔗 Public URL:', publicUrlData.publicUrl);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('❌ Error uploading user avatar:', error);
    throw error;
  }
}

/**
 * Удаляет старый аватар пользователя
 * @param {string} avatarUrl - URL аватара для удаления
 */
export async function deleteUserAvatar(avatarUrl) {
  try {
    if (!avatarUrl || !avatarUrl.includes('avatars/')) {
      console.log('⚠️ No avatar to delete or not from storage');
      return;
    }

    // Извлекаем путь файла из URL
    const urlParts = avatarUrl.split('avatars/');
    if (urlParts.length < 2) {
      console.warn('⚠️ Invalid avatar URL format');
      return;
    }

    const filePath = urlParts[1];
    console.log('🗑️ Deleting old avatar:', filePath);

    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath]);

    if (error) {
      console.error('❌ Error deleting avatar:', error);
      // Не бросаем ошибку, так как это некритично
    } else {
      console.log('✅ Old avatar deleted');
    }
  } catch (error) {
    console.error('❌ Error in deleteUserAvatar:', error);
  }
}

/**
 * Полный процесс: выбор + оптимизация + загрузка аватара пользователя
 * @param {string} userId - ID пользователя
 * @param {string|null} currentAvatarUrl - Текущий URL аватара (для удаления)
 * @returns {Promise<string|null>} - URL нового аватара или null
 */
export async function pickAndUploadUserAvatar(userId, currentAvatarUrl = null) {
  try {
    // 1. Запрашиваем разрешения
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Ошибка', 'Нет доступа к галерее');
      return null;
    }

    // 2. Выбираем изображение
    const imageUri = await pickImage();
    if (!imageUri) {
      return null;
    }

    // 3. Загружаем новый аватар
    const newAvatarUrl = await uploadUserAvatar(userId, imageUri);

    // 4. Удаляем старый аватар (если был)
    if (currentAvatarUrl) {
      await deleteUserAvatar(currentAvatarUrl);
    }

    return newAvatarUrl;
  } catch (error) {
    console.error('❌ Error in pickAndUploadUserAvatar:', error);
    Alert.alert('Ошибка', 'Не удалось загрузить фото');
    return null;
  }
}
