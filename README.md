# Musician Trade Thai

## Project info

**URL**: https://musiciantradethai.com

## Description

แพลตฟอร์มสำหรับหาคนเล่นดนตรีแทนงานกลางคืนแบบด่วน เชื่อมระหว่างร้าน/ผู้จัดงาน กับนักดนตรีที่พร้อมรับงานทันที

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI Components**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Deployment**: Vercel

## Getting Started

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

```bash
# Clone the repository
git clone https://github.com/poompandin-cloud/musician-trade2546.git
cd musician-trade2546

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## How can I deploy this project?

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your GitHub account to Vercel
3. Import the repository
4. Deploy automatically

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy the dist folder to your hosting provider
```

## Can I connect a custom domain?

Yes, you can!

To connect a domain, navigate to your hosting provider's dashboard and follow their domain setup instructions.

## Features

- **Job Posting**: ประกาศหาคนเล่นดนตรีแทน
- **Musician Profiles**: โปรไฟล์นักดนตรีพร้อมผลงาน
- **Real-time Updates**: อัปเดตสถานะงานแบบ real-time
- **Direct Contact**: ติดต่อผ่าน LINE และโทรศัพท์
- **Rating System**: ระบบประเมินความมืออาชีพ
- **Smart Search**: ค้นหาตามเครื่องดนตรีและพื้นที่

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
