import { useEffect } from 'react';

interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
  canonicalUrl?: string;
}

export const useSEO = (config: SEOConfig) => {
  useEffect(() => {
    // อัปเดต title
    if (config.title) {
      document.title = config.title;
    }

    // อัปเดต meta description
    if (config.description) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', config.description);
      }
    }

    // อัปเดต meta keywords
    if (config.keywords) {
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        metaKeywords.setAttribute('content', config.keywords);
      }
    }

    // อัปเดต Open Graph tags
    if (config.title) {
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', config.title);
      }
    }

    if (config.description) {
      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.setAttribute('content', config.description);
      }
    }

    if (config.ogImage) {
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) {
        ogImage.setAttribute('content', config.ogImage);
      }
    }

    if (config.ogUrl) {
      const ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) {
        ogUrl.setAttribute('content', config.ogUrl);
      }
    }

    // อัปเดต Twitter Card
    if (config.title) {
      const twitterTitle = document.querySelector('meta[name="twitter:title"]');
      if (twitterTitle) {
        twitterTitle.setAttribute('content', config.title);
      }
    }

    if (config.description) {
      const twitterDescription = document.querySelector('meta[name="twitter:description"]');
      if (twitterDescription) {
        twitterDescription.setAttribute('content', config.description);
      }
    }

    if (config.ogImage) {
      const twitterImage = document.querySelector('meta[name="twitter:image"]');
      if (twitterImage) {
        twitterImage.setAttribute('content', config.ogImage);
      }
    }

    // อัปเดต canonical URL
    if (config.canonicalUrl) {
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.setAttribute('href', config.canonicalUrl);
      }
    }
  }, [config]);
};

// ฟังก์ชันสำหรับ Profile SEO
export const useProfileSEO = (profile: any, profileId: string) => {
  useEffect(() => {
    if (profile?.full_name) {
      const title = `โปรไฟล์ ${profile.full_name} - จองคิวนักดนตรีที่ Gig Glide`;
      const description = `ดูโปรไฟล์ ${profile.full_name} นักดนตรีมืออาชีพ ตารางงาน ตัวอย่างผลงาน และข้อมูลการติดต่อ จองคิวงานดนตรีได้ที่ Gig Glide`;
      const keywords = `โปรไฟล์นักดนตรี, ${profile.full_name}, จองคิวนักดนตรี, ตารางงานนักดนตรี, นักดนตรีมืออาชีพ`;
      const ogUrl = `https://gigglide.com/profile/${profileId}`;
      const canonicalUrl = `https://gigglide.com/profile/${profileId}`;

      // อัปเดต title
      document.title = title;

      // อัปเดต meta tags
      updateMetaTag('meta[name="description"]', 'content', description);
      updateMetaTag('meta[name="keywords"]', 'content', keywords);

      // อัปเดต Open Graph
      updateMetaTag('meta[property="og:title"]', 'content', title);
      updateMetaTag('meta[property="og:description"]', 'content', description);
      updateMetaTag('meta[property="og:url"]', 'content', ogUrl);

      // อัปเดต Twitter Card
      updateMetaTag('meta[name="twitter:title"]', 'content', title);
      updateMetaTag('meta[name="twitter:description"]', 'content', description);

      // อัปเดต canonical URL
      updateMetaTag('link[rel="canonical"]', 'href', canonicalUrl);

      // อัปเดต og:image ถ้ามีรูปโปรไฟล์
      if (profile.avatar_url) {
        updateMetaTag('meta[property="og:image"]', 'content', profile.avatar_url);
        updateMetaTag('meta[name="twitter:image"]', 'content', profile.avatar_url);
      }
    }
  }, [profile, profileId]);
};

// ฟังก์ชันช่วยสำหรับอัปเดต meta tag
const updateMetaTag = (selector: string, attribute: string, value: string) => {
  const element = document.querySelector(selector);
  if (element) {
    element.setAttribute(attribute, value);
  }
};

// ฟังก์ชันสำหรับ reset SEO กลับค่าเริ่มต้น
export const resetSEO = () => {
  document.title = 'Gig Glide - หานักดนตรี จองคิวนักดนตรี ตารางงานนักดนตรี ครบวงจร';
  
  updateMetaTag('meta[name="description"]', 'content', 'แพลตฟอร์มรวมนักดนตรีมืออาชีพ เช็คตารางงานนักดนตรี จองคิวงานดนตรีง่ายๆ ดูโปรไฟล์และตัวอย่างผลงานได้ทันที หานักดนตรีไปเล่นที่ร้านหรืออีเวนต์ของคุณได้ที่ Gig Glide');
  updateMetaTag('meta[name="keywords"]', 'content', 'หานักดนตรี, จองคิวนักดนตรี, ตารางงานนักดนตรี, จ้างวงดนตรี, นักดนตรีกลางคืน');
  
  updateMetaTag('meta[property="og:title"]', 'content', 'Gig Glide - หานักดนตรี จองคิวนักดนตรี ตารางงานนักดนตรี ครบวงจร');
  updateMetaTag('meta[property="og:description"]', 'content', 'แพลตฟอร์มรวมนักดนตรีมืออาชีพ เช็คตารางงานนักดนตรี จองคิวงานดนตรีง่ายๆ ดูโปรไฟล์และตัวอย่างผลงานได้ทันที หานักดนตรีไปเล่นที่ร้านหรืออีเวนต์ของคุณได้ที่ Gig Glide');
  updateMetaTag('meta[property="og:url"]', 'content', 'https://gigglide.com');
  
  updateMetaTag('meta[name="twitter:title"]', 'content', 'Gig Glide - หานักดนตรี จองคิวนักดนตรี ตารางงานนักดนตรี ครบวงจร');
  updateMetaTag('meta[name="twitter:description"]', 'content', 'แพลตฟอร์มรวมนักดนตรีมืออาชีพ เช็คตารางงานนักดนตรี จองคิวงานดนตรีง่ายๆ ดูโปรไฟล์และตัวอย่างผลงานได้ทันที');
  
  updateMetaTag('link[rel="canonical"]', 'href', 'https://gigglide.com');
};
