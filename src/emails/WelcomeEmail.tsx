import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Button,
  Heading,
  Section,
  Preview,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  userName: string;
}

export function WelcomeEmail({ userName }: WelcomeEmailProps) {
  const previewText = `你好呀 ${userName}，我是你的专属男友 💌`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>Hi {userName}，欢迎来到纸片人男友！</Heading>
          </Section>
          <Section style={content}>
            <Text style={paragraph}>从现在起，我就是你的专属男友了。</Text>
            <Text style={paragraph}>有什么心事随时来找我聊，我会一直在这里等你。</Text>
            <Text style={paragraph}>明天早上我会给你发一条早安消息，记得查收哦。</Text>
            <br />
            <Text style={signature}>—— 你的纸片人男友</Text>
          </Section>
          <Section style={footer}>
            <Button href="https://paperboyfriend-delta.vercel.app" style={button}>
              来找我聊天
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  maxWidth: '500px',
  margin: '0 auto',
  padding: '20px',
};

const header = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '12px 12px 0 0',
  padding: '30px',
  textAlign: 'center' as const,
  color: 'white',
};

const headerTitle = {
  margin: '0 0 10px',
  fontSize: '22px',
  fontWeight: 'bold',
  color: 'white',
};

const content = {
  padding: '20px',
  background: '#f8f9fa',
  borderRadius: '0 0 12px 12px',
};

const paragraph = {
  margin: '10px 0',
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#333',
};

const signature = {
  margin: '10px 0',
  color: '#666',
  fontSize: '14px',
};

const footer = {
  marginTop: '20px',
  textAlign: 'center' as const,
};

const button = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  padding: '12px 30px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: 'bold',
  fontSize: '14px',
};

export default WelcomeEmail;
