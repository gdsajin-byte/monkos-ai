import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';

export default function HomeScreen({ navigation }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // PWA 설치 프롬프트 감지 (웹 전용)
    if (Platform.OS === 'web') {
      const handler = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallButton(true);
      };

      window.addEventListener('beforeinstallprompt', handler);

      // 이미 설치되어 있는지 확인
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setShowInstallButton(false);
      }

      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // iOS Safari의 경우 수동 안내
      alert(
        'iOS 사용자:\n1. 공유 버튼을 누르세요\n2. "홈 화면에 추가"를 선택하세요\n\nAndroid 사용자:\n1. 메뉴(⋮)를 누르세요\n2. "홈 화면에 추가"를 선택하세요'
      );
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowInstallButton(false);
    }

    setDeferredPrompt(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MONKOS</Text>
        <Text style={styles.subtitle}>AI-Powered Chat</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Welcome to MONKOS Chat.{'\n'}
          Start a conversation with our AI assistant.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation?.navigate('Chat')}
        >
          <Text style={styles.buttonText}>Start Chat</Text>
        </TouchableOpacity>

        {showInstallButton && Platform.OS === 'web' && (
          <TouchableOpacity
            style={styles.installButton}
            onPress={handleInstallClick}
          >
            <Text style={styles.installButtonText}>📱 앱으로 설치하기</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by Vertex AI</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8b8b9e',
    marginTop: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  description: {
    fontSize: 16,
    color: '#c4c4d4',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  installButton: {
    backgroundColor: '#10ac84',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#0cac78',
  },
  installButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingBottom: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#5a5a6e',
  },
});
