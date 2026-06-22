// ══════════════════════════════════════════════════
// src/navigation/AppNavigator.js
// ══════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { PetProvider } from '../context/PetContext';
import { supabase } from '../utils/supabase';

// ═══ ИМПОРТ ЭКРАНОВ ═══
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import MedicalScreen from '../screens/MedicalScreen';
import ActivityScreen from '../screens/ActivityScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddPetScreen from '../screens/AddPetScreen';
import PetDetailScreen from '../screens/PetDetailScreen'; // ✅ НОВЫЙ ИМПОРТ
import OCRReviewScreen from '../screens/OCRReviewScreen';
import RecordDetailScreen from '../screens/RecordDetailScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import DocumentsScreen from '../screens/DocumentsScreen';

// ═══ ИМПОРТ AI ASSISTANT ЭКРАНОВ ═══
import AIAssistantHubScreen from '../screens/AIAssistantHubScreen';
import AIAssistantChatScreen from '../screens/AIAssistantChatScreen';

// ═══ ИМПОРТ CHARITY КОМПОНЕНТОВ ═══
import CharityStoreScreen from '../components/charity/CharityStoreScreen';
import CharityHistoryScreen from '../components/charity/CharityHistoryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ═══ AI ASSISTANT STACK NAVIGATOR ═══
const AssistantStack = createNativeStackNavigator();

function AssistantNavigator() {
  return (
    <AssistantStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <AssistantStack.Screen 
        name="AIAssistantHub" 
        component={AIAssistantHubScreen} 
      />
      <AssistantStack.Screen 
        name="AIAssistantChat" 
        component={AIAssistantChatScreen} 
      />
    </AssistantStack.Navigator>
  );
}

// ═══ MAIN TABS NAVIGATOR (5 ТАБОВ) ═══
function MainTabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Medical':
              iconName = focused ? 'medical' : 'medical-outline';
              break;
            case 'Activity':
              iconName = focused ? 'fitness' : 'fitness-outline';
              break;
            case 'Assistant':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="Medical" 
        component={MedicalScreen}
        options={{ tabBarLabel: 'Medical' }}
      />
      <Tab.Screen 
        name="Activity" 
        component={ActivityScreen}
        options={{ tabBarLabel: 'Activity' }}
      />
      <Tab.Screen 
        name="Assistant" 
        component={AssistantNavigator}
        options={{ tabBarLabel: 'AI Chat' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// ═══ ROOT NAVIGATOR ═══
export default function AppNavigator() {
  const { user } = useAuth();
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!session ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          {/* ═══ MAIN TABS ОБЁРНУТ В PetProvider ═══ */}
          <Stack.Screen name="MainTabs">
            {() => (
              <PetProvider>
                <MainTabsNavigator />
              </PetProvider>
            )}
          </Stack.Screen>
          
          {/* ═══ МОДАЛЬНЫЕ ЭКРАНЫ ═══ */}
          <Stack.Screen 
            name="AddPet" 
            component={AddPetScreen}
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'Add New Pet',
              headerTitleStyle: { fontWeight: 'bold' },
            }}
          />
          
          {/* ✅ НОВЫЙ ЭКРАН: PetDetail */}
          <Stack.Screen 
            name="PetDetail" 
            component={PetDetailScreen}
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />

          {/* ═══ OCR REVIEW (вне PetProvider, по petId) ═══ */}
          <Stack.Screen
            name="OCRReview"
            component={OCRReviewScreen}
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />

          {/* ═══ RECORD DETAIL (вне PetProvider, по recordId) ═══ */}
          <Stack.Screen
            name="RecordDetail"
            component={RecordDetailScreen}
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          
          {/* ═══ APPOINTMENTS (вне PetProvider, по petId) ═══ */}
          <Stack.Screen
            name="Appointments"
            component={AppointmentsScreen}
            options={{
              headerShown: true,
              headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
              headerTintColor: '#6B4EFF',
              animation: 'slide_from_right',
            }}
          />

          {/* ═══ DOCUMENTS (вне PetProvider, по petId) ═══ */}
          <Stack.Screen
            name="Documents"
            component={DocumentsScreen}
            options={{
              headerShown: true,
              headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
              headerTintColor: '#6B4EFF',
              animation: 'slide_from_right',
            }}
          />

          {/* ═══ CHARITY ЭКРАНЫ ═══ */}
          <Stack.Screen 
            name="CharityStore" 
            component={CharityStoreScreen}
            options={{
              headerShown: true,
              headerTitle: 'Help a Shelter',
              headerTitleStyle: { 
                fontWeight: 'bold',
                fontSize: 20,
              },
              headerTintColor: '#6C63FF',
              animation: 'slide_from_right',
            }}
          />
          
          <Stack.Screen 
            name="CharityHistory" 
            component={CharityHistoryScreen}
            options={{
              headerShown: true,
              headerTitle: 'Donation History',
              headerTitleStyle: { 
                fontWeight: 'bold',
                fontSize: 20,
              },
              headerTintColor: '#6C63FF',
              animation: 'slide_from_right',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
