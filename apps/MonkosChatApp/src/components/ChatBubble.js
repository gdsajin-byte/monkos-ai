import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ChatBubble({ message, isUser, isError }) {
  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.aiContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.aiBubble,
          isError && styles.errorBubble,
        ]}
      >
        {!isUser && (
          <Text style={styles.label}>MONKOS</Text>
        )}
        <Text
          style={[
            styles.message,
            isUser ? styles.userMessage : styles.aiMessage,
          ]}
        >
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  aiContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: '#6c5ce7',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#2d2d44',
    borderBottomLeftRadius: 4,
  },
  errorBubble: {
    backgroundColor: '#4a3333',
    borderColor: '#e74c3c',
    borderWidth: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8b8b9e',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessage: {
    color: '#ffffff',
  },
  aiMessage: {
    color: '#e4e4ec',
  },
});
