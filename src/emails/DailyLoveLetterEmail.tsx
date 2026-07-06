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
  Link,
} from '@react-email/components';
import * as React from 'react';

interface DailyLoveLetterEmailProps {
  userName: string;
  loveLetter: string;
}

export function DailyLoveLetterEmail({ userName, loveLetter }: DailyLoveLetterEmailProps) {
  const previewText = `早安 ${userName}，今天也想你了 💕`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>早安，{userName} 💌</Heading>
            <Text style={headerSubtitle}>今天也想你了</Text>
          </Section>
          <Section style={content}>
            <Text style={letter}>{loveLetter}</Text>
            <br />
            <Text style={signature}>—— 你的纸片人男友 💕</Text>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>
              想跟我聊天？
              <Link href="https://paperboyfriend-delta.vercel.app" style={link}>
                点这里回来找我
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#fff5f7',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  maxWidth: '500px',
  margin: '0 auto',
  padding: '20px',
};

const header = {
  background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
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

const headerSubtitle = {
  margin: 0,
  opacity: 0.9,
  fontSize: '14px',
  color: 'white',
};

const content = {
  padding: '25px',
  background: '#fff5f7',
  borderRadius: '0 0 12px 12px',
  lineHeight: '1.8',
};

const letter = {
  margin: 0,
  color: '#333',
  fontSize: '15px',
  lineHeight: '1.8',
};

const signature = {
  margin: '10px 0',
  color: '#555',
  textAlign: 'right' as const,
  fontSize: '14px',
};

const footer = {
  marginTop: '20px',
  textAlign: 'center' as const,
  padding: '10px 0',
};

const footerText = {
  margin: '5px 0',
  color: '#999',
  fontSize: '12px',
};

const link = {
  color: '#c44569',
  textDecoration: 'none',
  fontWeight: 500,
};

export default DailyLoveLetterEmail;
