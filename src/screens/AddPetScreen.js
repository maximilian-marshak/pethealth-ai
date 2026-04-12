    import React, { useState, useEffect } from 'react';
    import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    } from 'react-native';
    import { supabase } from '../utils/supabase';

    const SPECIES_OPTIONS = ['Dog', 'Cat', 'Rabbit', 'Bird', 'Hamster', 'Other'];
    const GENDER_OPTIONS = ['Male', 'Female'];

    export default function AddPetScreen({ navigation }) {
    const [name, setName] = useState('');
    const [species, setSpecies] = useState('');
    const [breed, setBreed] = useState('');
    const [age, setAge] = useState('');
    const [weight, setWeight] = useState('');
    const [gender, setGender] = useState('');
    const [microchipId, setMicrochipId] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // ✅ Load user on screen mount and keep it in state
    useEffect(() => {
        const loadUser = async () => {
        try {
            // Try getSession first (more reliable in React Native)
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
            console.error('Session error:', sessionError);
            return;
            }

            if (session?.user) {
            console.log('✅ User loaded from session:', session.user.id);
            setCurrentUser(session.user);
            return;
            }

            // Fallback to getUser
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError) {
            console.error('User error:', userError);
            return;
            }

            if (user) {
            console.log('✅ User loaded from getUser:', user.id);
            setCurrentUser(user);
            } else {
            console.log('❌ No user found - redirecting to login');
            Alert.alert('Not Logged In', 'Please log in first.', [
                { text: 'OK', onPress: () => navigation.replace('Login') },
            ]);
            }
        } catch (e) {
            console.error('Error loading user:', e);
        }
        };

        loadUser();

        // ✅ Also listen to auth state changes
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        if (session?.user) {
            setCurrentUser(session.user);
        } else {
            setCurrentUser(null);
        }
        });

        return () => {
        authListener?.subscription?.unsubscribe();
        };
    }, []);

    const validateForm = () => {
        if (!name.trim()) {
        Alert.alert('Missing Info', "Please enter your pet's name");
        return false;
        }
        if (!species) {
        Alert.alert('Missing Info', "Please select your pet's species");
        return false;
        }
        if (!gender) {
        Alert.alert('Missing Info', "Please select your pet's gender");
        return false;
        }
        return true;
    };

    // ✅ Convert age in years to birth_date string (YYYY-MM-DD)
    const getBirthDate = (ageYears) => {
        const parsed = parseFloat(ageYears);
        if (!ageYears || isNaN(parsed) || parsed < 0) return null;
        const date = new Date();
        date.setFullYear(date.getFullYear() - Math.floor(parsed));
        // Handle months from decimal (e.g. 1.5 years = 1 year 6 months)
        const remainingMonths = Math.round((parsed % 1) * 12);
        date.setMonth(date.getMonth() - remainingMonths);
        return date.toISOString().split('T')[0];
    };

    const handleSavePet = async () => {
        if (!validateForm()) return;

        setLoading(true);

        try {
        // ✅ Always get fresh session right before inserting
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        console.log('=== SAVE PET DEBUG ===');
        console.log('Session:', session);
        console.log('Session User ID:', session?.user?.id);
        console.log('Session Error:', sessionError);
        console.log('Cached User:', currentUser?.id);

        // ✅ Use session user OR cached user as fallback
        const userId = session?.user?.id ?? currentUser?.id;

        if (!userId) {
            Alert.alert(
            'Not Logged In',
            'Your session has expired. Please log in again.',
            [{ text: 'OK', onPress: () => navigation.replace('Login') }]
            );
            setLoading(false);
            return;
        }

        console.log('✅ Using userId:', userId);

        const petData = {
            owner_id: userId,
            name: name.trim(),
            species: species,
            breed: breed.trim() || null,
            birth_date: getBirthDate(age),
            weight: weight ? parseFloat(weight) : null,
            weight_unit: 'kg',
            gender: gender.toLowerCase(),
            microchip_id: microchipId.trim() || null,
        };

        console.log('Pet data to insert:', JSON.stringify(petData, null, 2));

        const { data, error } = await supabase
            .from('pets')
            .insert([petData])
            .select();

        console.log('Insert data:', data);
        console.log('Insert error:', error);

        if (error) {
            console.error('Supabase insert error:', error.message, error.code, error.details);

            // ✅ Show friendly error messages based on error type
            if (error.code === '23503') {
            // Foreign key violation
            Alert.alert(
                'Authentication Error',
                'Your account could not be verified. Please log out and log in again.',
                [
                { text: 'Log Out', onPress: () => handleLogout() },
                { text: 'Cancel', style: 'cancel' },
                ]
            );
            } else if (error.code === '23505') {
            Alert.alert('Duplicate Entry', 'A pet with this microchip ID already exists.');
            } else if (error.code === '42501') {
            Alert.alert('Permission Denied', 'You do not have permission to add pets.');
            } else {
            Alert.alert('Failed to Save', error.message);
            }
            return;
        }

        console.log('✅ Pet saved successfully:', data);

        Alert.alert(
            '🎉 Pet Added!',
            `${name} has been added successfully!`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        } catch (e) {
        console.error('Unexpected error:', e);
        Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
        setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigation.replace('Login');
    };

    return (
        <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            {/* Header */}
            <View style={styles.header}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Add New Pet</Text>
            <Text style={styles.subtitle}>Tell us about your furry friend</Text>

            {/* ✅ Debug: Show current user status */}
            {__DEV__ && (
                <Text style={styles.debugText}>
                {currentUser ? `✅ User: ${currentUser.id.slice(0, 8)}...` : '❌ No user loaded'}
                </Text>
            )}
            </View>

            {/* Form */}
            <View style={styles.form}>

            {/* Pet Name */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Pet Name *</Text>
                <TextInput
                style={styles.input}
                placeholder="e.g. Buddy, Luna, Max"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                placeholderTextColor="#999"
                />
            </View>

            {/* Species Selector */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Species *</Text>
                <View style={styles.optionsGrid}>
                {SPECIES_OPTIONS.map((option) => (
                    <TouchableOpacity
                    key={option}
                    style={[
                        styles.optionButton,
                        species === option && styles.optionButtonSelected,
                    ]}
                    onPress={() => setSpecies(option)}
                    >
                    <Text
                        style={[
                        styles.optionText,
                        species === option && styles.optionTextSelected,
                        ]}
                    >
                        {option}
                    </Text>
                    </TouchableOpacity>
                ))}
                </View>
            </View>

            {/* Gender Selector */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender *</Text>
                <View style={styles.optionsRow}>
                {GENDER_OPTIONS.map((option) => (
                    <TouchableOpacity
                    key={option}
                    style={[
                        styles.genderButton,
                        gender === option && styles.optionButtonSelected,
                    ]}
                    onPress={() => setGender(option)}
                    >
                    <Text
                        style={[
                        styles.optionText,
                        gender === option && styles.optionTextSelected,
                        ]}
                    >
                        {option === 'Male' ? '♂ Male' : '♀ Female'}
                    </Text>
                    </TouchableOpacity>
                ))}
                </View>
            </View>

            {/* Breed */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Breed</Text>
                <TextInput
                style={styles.input}
                placeholder="e.g. Golden Retriever, Persian"
                value={breed}
                onChangeText={setBreed}
                autoCapitalize="words"
                placeholderTextColor="#999"
                />
            </View>

            {/* Age and Weight Row */}
            <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Age (years)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. 2"
                    value={age}
                    onChangeText={setAge}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#999"
                />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. 5.5"
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#999"
                />
                </View>
            </View>

            {/* Microchip ID */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Microchip ID</Text>
                <TextInput
                style={styles.input}
                placeholder="e.g. 985112345678903"
                value={microchipId}
                onChangeText={setMicrochipId}
                keyboardType="numeric"
                placeholderTextColor="#999"
                />
            </View>

            {/* TEMPORARY DEBUG BUTTON - DELETE AFTER FIXING */}
            <TouchableOpacity
            style={{ backgroundColor: 'red', padding: 14, borderRadius: 12, marginBottom: 10, alignItems: 'center' }}
            onPress={async () => {
                const { data: { session } } = await supabase.auth.getSession();
                const { data: { user } } = await supabase.auth.getUser();
                
                Alert.alert(
                '🔴 Auth Debug',
                `Session ID: ${session?.user?.id ?? 'NONE'}\n\ngetUser ID: ${user?.id ?? 'NONE'}\n\nEmail: ${session?.user?.email ?? 'NONE'}\n\nExpires: ${session?.expires_at ?? 'NONE'}`
                );
            }}
            >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>🔴 DEBUG AUTH</Text>
            </TouchableOpacity>

            {/* Save Button */}
            <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleSavePet}
                disabled={loading}
            >
                {loading ? (
                <View style={styles.loadingRow}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.saveButtonText}>  Saving...</Text>
                </View>
                ) : (
                <Text style={styles.saveButtonText}>🐾 Save Pet</Text>
                )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
                disabled={loading}
            >
                <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            </View>
        </ScrollView>
        </KeyboardAvoidingView>
    );
    }

    const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContent: {
        paddingBottom: 40,
    },

    // Header
    header: {
        backgroundColor: '#4A90E2',
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    backButton: {
        marginBottom: 16,
    },
    backButtonText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
    },
    debugText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 8,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },

    // Form
    form: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },

    // Options
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    optionButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#e0e0e0',
        backgroundColor: '#fff',
    },
    genderButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#e0e0e0',
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    optionButtonSelected: {
        borderColor: '#4A90E2',
        backgroundColor: '#EBF4FF',
    },
    optionText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    optionTextSelected: {
        color: '#4A90E2',
        fontWeight: '700',
    },

    // Row inputs
    rowInputs: {
        flexDirection: 'row',
    },

    // Buttons
    saveButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonDisabled: {
        backgroundColor: '#93C5FD',
        shadowOpacity: 0,
        elevation: 0,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cancelButton: {
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    cancelButtonText: {
        color: '#999',
        fontSize: 16,
        fontWeight: '500',
    },
    });
