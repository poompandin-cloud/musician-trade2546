import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Plus, Image, ArrowLeft, Trash2, Flag, RotateCcw } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
// import { ReportModal, ImageUploadGuard, InputDisclaimer } from '@/components/ContentModeration'; // ปิดชั่วคราวเพื่อแก้ไขปัญหา

interface Message {
  id: string;
  text: string;
  sender_name: string;
  time: string;
  is_me: boolean;
  avatar_url?: string;
  user_id: string;
  image_url?: string;
  instrument?: string;
  role?: string;
}

const PublicChat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingMessage, setDeletingMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    message: Message | null;
  }>({ visible: false, x: 0, y: 0, message: null });
  
  // Content Moderation States - ปิดชั่วคราว
  // const [showReportModal, setShowReportModal] = useState(false);
  // const [messageToReport, setMessageToReport] = useState<Message | null>(null);
  // const [showImageGuard, setShowImageGuard] = useState(false);
  // const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ดึงข้อมูลผู้ใช้ปัจจุบัน
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      setLoading(false);
    };
    getCurrentUser();
  }, []);

  // ดึงข้อมูลแชทจาก Supabase - Initial Load
  useEffect(() => {
    console.log('🎯 useEffect triggered for initial load');
    console.log('📊 Loading state:', loading);
    console.log('🆔 Current user:', currentUser?.id ? 'authenticated' : 'not authenticated');
    
    // สำคัญ: ตรวจสอบว่าไม่มีเงื่อนไขอื่นมาบล็อก
    if (loading) {
      console.log('⏳ Still loading user data, waiting...');
      return;
    }

    console.log('✅ Ready to fetch messages - no blocking conditions');
    
    const fetchMessages = async () => {
      console.log('🚀 fetchMessages function called');
      console.log('📥 Fetching initial messages...');
      console.log('🆔 Current user ID:', currentUser?.id);
      console.log('⏰ Fetch time:', new Date().toLocaleTimeString());
      
      // ✅ ล้างข้อมูลเก่าก่อน fetch ใหม่ทุกครั้ง
      console.log('🧹 Clearing old messages cache...');
      setMessages([]);
      
      try {
        // ดึงข้อมูลทั้งหมดโดยไม่มีการกรอง - ทำงานได้ทั้ง login และไม่ login
        console.log('📡 Executing Supabase query...');
        
        let data, error;
        
        try {
          // ดึงข้อมูลแบบ Left Join ที่ปลอดภัย - ใช้ profiles:user_id(*)
          console.log('📡 Executing Supabase query with safe Left Join...');
          
          const result = await supabase
            .from('public_chats')
            .select(`
              *,
              profiles:user_id (
                full_name,
                avatar_url,
                instrument,
                instruments,
                role
              )
            `)
            .order('created_at', { ascending: true })
            .limit(50); // จำกัด 50 ข้อความล่าสุด
          
          data = result.data;
          error = result.error;
          
        } catch (queryError) {
          console.error('❌ Error executing Supabase query:', queryError);
          error = queryError;
          data = null;
        }

        console.log('📊 Query completed - Messages:', data?.length || 0, 'Error:', !!error);
        
        if (error) {
          console.error('❌ Error fetching messages:', error);
          console.error('❌ Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          console.log('🚫 fetchMessages failed due to database error');
          console.log('📊 Database error: ' + error.message);
          return;
        }

        console.log(`✅ Fetched ${data?.length || 0} messages from database`);
        console.log('📊 Raw data sample:', data?.slice(0, 2));
        
        // ตรวจสอบว่ามีข้อมูลจริงหรือไม่
        if (!data || data.length === 0) {
          console.log('⚠️ No messages found in database');
          console.log('💾 Setting empty messages array');
          setMessages([]); // สำคัญ: เซ็ตเป็น array ว่าง
          console.log('💾 setMessages called with empty array');
          console.log('📊 Successfully fetched and displayed 0 messages (empty database)');
          return;
        }

        console.log('🔄 Processing messages for display...');
        let formattedMessages: Message[] = [];
        
        try {
          formattedMessages = data.map((msg: any) => {
            // ตรวจสอบข้อมูล profile อย่างปลอดภัย
            let profileData = msg.profiles || {};
            
            // ตรวจสอบ column ที่มีอยู่จริง
            let instrumentValue = null;
            let roleValue = null;
            
            if (profileData) {
              // ตรวจสอบว่าใช้ instruments (มี s) หรือ instrument (ไม่มี s)
              instrumentValue = profileData.instruments || profileData.instrument || null;
              roleValue = profileData.role || null;
            }
            
            return {
              id: msg.id,
              sender_name: profileData.full_name || 'ผู้ใช้ทั่วไป',
              text: msg.content,
              time: new Date(msg.created_at).toLocaleTimeString("th-TH", { 
                hour: "2-digit", 
                minute: "2-digit" 
              }),
              is_me: msg.user_id === currentUser?.id,
              avatar_url: profileData.avatar_url,
              user_id: msg.user_id,
              image_url: msg.image_url,
              instrument: instrumentValue,
              role: roleValue
            };
          });
        } catch (processingError) {
          console.error('❌ Error processing messages:', processingError);
          
          // Fallback processing - สร้างข้อความพื้นฐาน
          formattedMessages = data.map((msg: any) => ({
            id: msg.id,
            sender_name: 'ผู้ใช้ทั่วไป',
            text: msg.content,
            time: new Date(msg.created_at).toLocaleTimeString("th-TH", { 
              hour: "2-digit", 
              minute: "2-digit" 
            }),
            is_me: msg.user_id === currentUser?.id,
            avatar_url: null,
            user_id: msg.user_id,
            image_url: msg.image_url,
            instrument: null,
            role: null
          }));
        }

        console.log(`📝 Formatted ${formattedMessages.length} messages`);
        
        // สำคัญ: เรียก setMessages เพื่ออัปเดต UI
        setMessages(formattedMessages);
        
        console.log('✅ Messages loaded successfully');
        console.log('📊 Successfully fetched and displayed ' + data.length + ' messages');
        
        // ✅ ปิด loading state หลังจาก fetch เสร็จเสมอ
        setLoading(false);
        
        // Auto scroll ลงล่างหลังโหลด
        setTimeout(() => {
          console.log('📜 Auto-scrolling to bottom...');
          scrollToBottom();
        }, 100);
        
      } catch (error) {
        console.error('❌ Error in fetchMessages:', error);
        console.error('❌ Error stack:', error.stack);
        console.log('🚫 fetchMessages failed due to exception');
        console.log('📊 Unexpected error: ' + error.message);
        
        // ✅ ปิด loading state แม้จะเกิด error
        setLoading(false);
      }
    };

    console.log('🚀 Starting initial message fetch...');
    console.log('🎯 No blocking conditions - calling fetchMessages immediately');
    fetchMessages();

    // เปิด Realtime subscription - แก้ไขให้ทำงานอย่างถูกต้อง
    console.log('🔌 Setting up Supabase Realtime connection...');
    
    const channel = supabase
      .channel('public-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'public_chats'
        },
        async (payload) => {
          console.log('🔔 Realtime: New message received:', payload);
          console.log('📝 Message content:', payload.new.content);
          console.log('👤 Sender user_id:', payload.new.user_id);
          console.log('🆔 Current user_id:', currentUser?.id);
          console.log('🎯 Is this my message?:', payload.new.user_id === currentUser?.id);
          console.log('📊 Total messages in state:', messages.length);
          
          // สำคัญ: ตรวจสอบว่ามี currentUser หรือไม่
          if (!currentUser) {
            console.log('⚠️ No current user, but still processing message for display');
          }
          
          try {
            // ดึงข้อมูลผู้ใช้ของข้อความใหม่แบบปลอดภัย
            console.log('🔍 Fetching profile for realtime message...');
            let profileData, profileError;
            
            try {
              // ลองดึงข้อมูลแบบปลอดภัยก่อน
              const safeResult = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', payload.new.user_id)
                .single();
              
              profileData = safeResult.data;
              profileError = safeResult.error;
              
              console.log('🔍 Safe realtime profile fetch completed');
              console.log('🔍 Safe realtime profile data:', profileData);
              console.log('🔍 Safe realtime profile error:', profileError);
              
              // ถ้า safe query สำเร็จ ลองดึงข้อมูลเพิ่ม
              if (!profileError && profileData) {
                console.log('🔍 Checking instrument columns for realtime...');
                
                try {
                  // ตรวจสอบ column ที่มีอยู่จริง
                  const columnCheck = await supabase
                    .from('profiles')
                    .select('instrument, instruments, role')
                    .eq('id', payload.new.user_id)
                    .single();
                  
                  console.log('🔍 Column check result:', columnCheck.data);
                  console.log('🔍 Column check error:', columnCheck.error);
                  
                  if (!columnCheck.error && columnCheck.data) {
                    // รวมข้อมูลจากทั้งสอง query
                    profileData = {
                      ...profileData,
                      ...columnCheck.data
                    };
                    
                    console.log('🔍 Combined realtime profile data:', profileData);
                  }
                } catch (columnCheckError) {
                  console.error('❌ Error checking realtime columns:', columnCheckError);
                  console.log('⚠️ Continuing with safe realtime profile data');
                }
              }
            } catch (realtimeError) {
              console.error('❌ Error in realtime profile fetch:', realtimeError);
              profileError = realtimeError;
              profileData = null;
            }

            if (profileError) {
              console.error('❌ Error fetching profile for new message:', profileError);
              // แม้จะดึง profile ไม่ได้ ก็ยังควรแสดงข้อความ
              const fallbackMessage: Message = {
                id: payload.new.id,
                sender_name: 'ผู้ใช้ทั่วไป',
                text: payload.new.content,
                time: new Date(payload.new.created_at).toLocaleTimeString("th-TH", { 
                  hour: "2-digit", 
                  minute: "2-digit" 
                }),
                is_me: payload.new.user_id === currentUser?.id,
                avatar_url: null,
                user_id: payload.new.user_id,
                image_url: payload.new.image_url,
                instrument: null,
                role: null
              };
              
              setMessages(prev => {
                const messageExists = prev.some(msg => msg.id === fallbackMessage.id);
                if (messageExists) return prev;
                
                const updatedMessages = [...prev, fallbackMessage];
                console.log('📨 Added fallback message to state');
                return updatedMessages;
              });
              return;
            }

            // ตรวจสอบข้อมูล realtime อย่างปลอดภัย
            let realtimeInstrumentValue = null;
            let realtimeRoleValue = null;
            
            if (profileData) {
              console.log('👤 Profile data from realtime:', profileData);
              console.log('🔍 All available keys in realtime profile:', Object.keys(profileData || {}));
              console.log('🔍 Checking for instruments (with s) in realtime:', profileData.instruments);
              console.log('🔍 Checking for instrument (without s) in realtime:', profileData.instrument);
              
              // ตรวจสอบว่าใช้ instruments (มี s) หรือ instrument (ไม่มี s)
              realtimeInstrumentValue = profileData.instruments || profileData.instrument || null;
              realtimeRoleValue = profileData.role || null;
              
              console.log('🎸 Final realtime instrument value:', realtimeInstrumentValue);
              console.log('🎭 Final realtime role value:', realtimeRoleValue);
            }

            const newMessage: Message = {
              id: payload.new.id,
              sender_name: profileData?.full_name || 'ผู้ใช้ทั่วไป',
              text: payload.new.content,
              time: new Date(payload.new.created_at).toLocaleTimeString("th-TH", { 
                hour: "2-digit", 
                minute: "2-digit" 
              }),
              is_me: payload.new.user_id === currentUser?.id,
              avatar_url: profileData?.avatar_url,
              user_id: payload.new.user_id,
              image_url: payload.new.image_url,
              instrument: realtimeInstrumentValue,
              role: realtimeRoleValue
            };

            console.log('📨 Adding new message to state with badge:', {
              sender_name: newMessage.sender_name,
              instrument: newMessage.instrument,
              role: newMessage.role,
              badge: newMessage.instrument || newMessage.role || 'สมาชิก'
            });
            
            // สำคัญ: อัปเดต state ให้ทุกคนเห็น - ไม่มีเงื่อนไข!
            setMessages(prev => {
              console.log('📚 Current messages count:', prev.length);
              
              // ตรวจสอบว่าข้อความนี้มีอยู่แล้วหรือไม่ (ป้องกันซ้ำ)
              const messageExists = prev.some(msg => msg.id === newMessage.id);
              if (messageExists) {
                console.log('⚠️ Message already exists, skipping update');
                return prev;
              }
              
              const updatedMessages = [...prev, newMessage];
              console.log('📚 Updated messages count:', updatedMessages.length);
              console.log('🎯 Message added to state - ALL users should see this now!');
              console.log('🌐 Broadcasting to ALL connected clients!');
              
              // Force re-render ด้วยการสร้าง array ใหม่
              return updatedMessages;
            });
          } catch (error) {
            console.error('❌ Error processing new message:', error);
            
            // แม้จะเกิด error ก็ยังพยายามแสดงข้อความ
            const emergencyMessage: Message = {
              id: payload.new.id,
              sender_name: 'ผู้ใช้ทั่วไป',
              text: payload.new.content,
              time: new Date(payload.new.created_at).toLocaleTimeString("th-TH", { 
                hour: "2-digit", 
                minute: "2-digit" 
              }),
              is_me: payload.new.user_id === currentUser?.id,
              avatar_url: null,
              user_id: payload.new.user_id,
              image_url: payload.new.image_url,
              instrument: null,
              role: null
            };
            
            setMessages(prev => {
              const messageExists = prev.some(msg => msg.id === emergencyMessage.id);
              if (messageExists) return prev;
              return [...prev, emergencyMessage];
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('🔄 Realtime subscription status:', status);
        console.log('📊 Current online users count:', status === 'SUBSCRIBED' ? 'Connected' : 'Disconnected');
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connection established successfully');
          console.log('🌐 Ready to receive messages from ALL users!');
          console.log('📊 Online users should now see new messages');
        } else if (status === 'CHANNEL_ERROR') {
          console.log('❌ Realtime connection error - will retry automatically');
        } else if (status === 'TIMED_OUT') {
          console.log('⏰ Realtime connection timed out - will retry automatically');
        } else if (status === 'CLOSED') {
          console.log('🔌 Realtime connection closed - will reconnect automatically');
        }
      });

    return () => {
      console.log('🧹 Cleaning up Realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [currentUser]); // ลบ loading ออกเพื่อป้องกัน loop

  // Scroll ลงไปล่างสุดอัตโนมัติ
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]); // ใช้ messages.length แทน messages array

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!currentUser) {
      toast({
        title: "กรุณาเข้าสู่ระบบก่อนร่วมพูดคุย",
        description: "เข้าสู่ระบบเพื่อส่งข้อความในแชทสาธารณะ",
        variant: "destructive",
        action: (
          <Button onClick={() => navigate("/auth")} className="bg-blue-600 hover:bg-blue-700">
            เข้าสู่ระบบ
          </Button>
        )
      });
      return;
    }

    if (!inputText.trim() && !uploadingImage) return;

    try {
      console.log('📤 Sending message:', inputText.trim());
      console.log('🆔 Current user ID:', currentUser.id);
      console.log('💾 Inserting into public_chats table...');
      
      const { data, error } = await supabase
        .from('public_chats')
        .insert({
          content: inputText.trim(),
          user_id: currentUser.id,
          image_url: null // จะถูกอัปเดตเมื่อมีรูปภาพ
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Insert Error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        console.error('❌ RLS Policy Check - User ID:', currentUser.id);
        console.error('❌ RLS Policy Check - Content:', inputText.trim());
        console.error('❌ RLS Policy Check - Table: public_chats');
        
        toast({
          title: "ส่งข้อความไม่สำเร็จ",
          description: `ข้อผิดพลาด: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Message inserted successfully:', data);
      console.log('📊 Message ID:', data.id);
      console.log('📝 Message content:', data.content);
      console.log('👤 User ID:', data.user_id);
      console.log('⏰ Created at:', data.created_at);
      console.log('🔄 Realtime should trigger and add to state...');

      // ดึงข้อมูล profile ของตัวเองเพื่อแสดง badge ทันที
      try {
        console.log('🎸 Fetching current user profile for instant badge...');
        const { data: currentProfile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, instrument, instruments, role')
          .eq('id', currentUser.id)
          .single();

        if (!profileError && currentProfile) {
          console.log('🎸 Current user profile found:', currentProfile);
          
          // ตรวจสอบว่าใช้ instruments (มี s) หรือ instrument (ไม่มี s) พร้อม default value
          const currentInstrumentValue = currentProfile?.instruments || currentProfile?.instrument || 'ไม่ระบุ';
          const currentRoleValue = currentProfile?.role || 'สมาชิก';
          
          // สร้าง message object สำหรับตัวเองทันที พร้อม default values
          const instantMessage: Message = {
            id: data.id,
            sender_name: currentProfile?.full_name || 'ผู้ใช้ทั่วไป',
            text: data.content,
            time: new Date(data.created_at).toLocaleTimeString("th-TH", { 
              hour: "2-digit", 
              minute: "2-digit" 
            }),
            is_me: true,
            avatar_url: currentProfile.avatar_url,
            user_id: currentUser.id,
            image_url: data.image_url,
            instrument: currentInstrumentValue,
            role: currentRoleValue
          };

          console.log('🎸 Adding instant message with badge:', instantMessage);
          
          // เพิ่มข้อความทันทีสำหรับตัวเอง
          setMessages(prev => {
            const messageExists = prev.some(msg => msg.id === instantMessage.id);
            if (messageExists) return prev;
            return [...prev, instantMessage];
          });
          
          console.log('✅ Instant message with badge added for sender');
        } else {
          console.log('⚠️ Could not fetch current user profile, will rely on realtime');
          if (profileError) {
            console.error('❌ Profile fetch error:', profileError);
          }
        }
      } catch (profileFetchError) {
        console.error('❌ Error fetching current user profile:', profileFetchError);
        console.log('⚠️ Will rely on realtime subscription for badge display');
      }

      // ข้อความจะถูกเพิ่มผ่าน Realtime subscription (สำหรับคนอื่น)
      setInputText("");
      setUploadingImage(false);
      inputRef.current?.focus();
      
      // Success feedback
      toast({
        title: "ส่งข้อความสำเร็จ",
        description: "ข้อความของคุณถูกส่งแล้ว",
        duration: 2000
      });
      
    } catch (error) {
      console.error('❌ Unexpected error in handleSendMessage:', error);
      console.error('❌ Error stack:', error.stack);
      
      toast({
        title: "เกิดข้อผิดพลาดที่ไม่คาดคิด",
        description: "กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!currentUser) {
      toast({
        title: "กรุณาเข้าสู่ระบบ",
        description: "เข้าสู่ระบบเพื่ออัปโหลดรูปภาพ",
        variant: "destructive"
      });
      return;
    }

    if (!file) return;

    // ตรวจสอบประเภทไฟล์
    if (!file.type.startsWith('image/')) {
      toast({
        title: "ไฟล์ไม่ถูกต้อง",
        description: "กรุณาเลือกไฟล์รูปภาพเท่านั้น",
        variant: "destructive"
      });
      return;
    }

    // ตรวจสอบขนาดไฟล์ (สูงสุด 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "ไฟล์ใหญ่เกินไป",
        description: "กรุณาเลือกรูปภาพขนาดไม่เกิน 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingImage(true);
    
    try {
      console.log('📤 Uploading image:', file.name);
      console.log('📊 File size:', file.size);
      console.log('📊 File type:', file.type);

      // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `chat-images/${fileName}`;

      // อัปโหลดไปยัง Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw uploadError;
      }

      console.log('✅ Upload successful:', uploadData);

      // ดึง URL สาธารณะ
      const { data: { publicUrl } } = supabase.storage
        .from('chat_images')
        .getPublicUrl(filePath);

      console.log('🔗 Public URL:', publicUrl);

      // อัปเดตข้อความในฐานข้อมูล
      const { data: messageData, error: updateError } = await supabase
        .from('public_chats')
        .insert({
          content: '', // ข้อความว่าง มีแต่รูปภาพ
          user_id: currentUser.id,
          image_url: publicUrl
        })
        .select()
        .single();

      if (updateError) {
        console.error('❌ Database update error:', updateError);
        throw updateError;
      }

      console.log('✅ Message with image inserted successfully:', messageData);

      toast({
        title: "อัปโหลดรูปภาพสำเร็จ",
        description: "รูปภาพของคุณถูกส่งแล้ว",
        duration: 2000
      });

    } catch (error) {
      console.error('❌ Error uploading image:', error);
      
      toast({
        title: "อัปโหลดรูปภาพไม่สำเร็จ",
        description: "กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file); // ใช้งานแบบปกติชั่วคราว
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteMessage = async (message: Message) => {
    if (!currentUser) return;
    
    setDeletingMessage(message.id);
    
    try {
      console.log('🗑️ Deleting message:', message.id);
      console.log('🆔 Current user ID:', currentUser.id);
      console.log('👤 Message user_id:', message.user_id);
      console.log('🖼️ Message has image:', !!message.image_url);
      console.log('📝 Message content:', message.text);
      console.log('🔗 Message image_url:', message.image_url);
      
      // ตรวจสอบว่าเป็นข้อความของตัวเองจริงๆ
      if (message.user_id !== currentUser.id) {
        console.error('❌ Cannot delete message: Not message owner');
        throw new Error('คุณไม่มีสิทธิ์ลบข้อความนี้');
      }
      
      // 1. ลบข้อความจากฐานข้อมูล (สำคัญ: ต้องสำเร็จก่อน)
      console.log('🗑️ Attempting to delete from database...');
      
      const { data: deleteData, error: deleteError } = await supabase
        .from('public_chats')
        .delete()
        .eq('id', message.id)
        .eq('user_id', currentUser.id) // เพิ่มเงื่อนไขว่าต้องเป็นเจ้าของข้อความ
        .select();

      console.log('🗑️ DB Delete Result:', deleteError);
      console.log('🗑️ DB Delete Data:', deleteData);
      
      if (deleteError) {
        console.error('❌ Error deleting message from database:', deleteError);
        console.error('❌ Error details:', {
          message: deleteError.message,
          details: deleteError.details,
          hint: deleteError.hint,
          code: deleteError.code
        });
        
        // ตรวจสอบว่าเป็นปัญหา permission หรือไม่
        if (deleteError.code === '42501' || deleteError.message.includes('permission')) {
          console.error('❌ Permission denied - Check RLS policies');
          console.error('💡 Make sure RLS policy allows users to delete their own messages');
        }
        
        throw deleteError;
      }

      console.log('✅ Message deleted from database successfully');
      console.log('📊 Deleted rows:', deleteData?.length || 0);

      // 2. ลบรูปภาพจาก Supabase Storage (ถ้ามี) - ทำหลังจากลบข้อความสำเร็จ
      if (message.image_url) {
        console.log('🖼️ Deleting image from storage...');
        
        try {
          // ดึง path จาก URL
          const url = new URL(message.image_url);
          const pathParts = url.pathname.split('/');
          const fileName = pathParts[pathParts.length - 1];
          const filePath = `chat-images/${fileName}`;
          
          console.log('📁 Image file path:', filePath);
          
          // ลบไฟล์จาก storage
          const { data: storageData, error: storageError } = await supabase.storage
            .from('chat_images')
            .remove([filePath]);

          console.log('🖼️ Storage Delete Result:', storageError);
          console.log('🖼️ Storage Delete Data:', storageData);

          if (storageError) {
            console.error('❌ Error deleting image from storage:', storageError);
            console.error('❌ Storage error message:', storageError.message);
            // ไม่ throw error เพราะข้อความถูกลบไปแล้ว
          } else {
            console.log('✅ Image deleted from storage successfully');
          }
        } catch (storageError) {
          console.error('❌ Error processing image deletion:', storageError);
          // ไม่ throw error เพราะข้อความถูกลบไปแล้ว
        }
      }

      // 3. อัปเดต state ทันที (Realtime จะอัปเดตอีกที)
      setMessages(prev => prev.filter(msg => msg.id !== message.id));
      
      console.log('✅ Message removed from local state');
      
      toast({
        title: "ลบข้อความสำเร็จ",
        description: "ข้อความถูกลบแล้ว",
        duration: 2000
      });

    } catch (error) {
      console.error('❌ Error in handleDeleteMessage:', error);
      console.error('❌ Error stack:', error.stack);
      
      toast({
        title: "ลบข้อความไม่สำเร็จ",
        description: error.message || "กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    } finally {
      setDeletingMessage(null);
      setShowDeleteModal(false);
      setMessageToDelete(null);
    }
  };

  const openDeleteModal = (message: Message) => {
    setMessageToDelete(message);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setMessageToDelete(null);
  };

  const handleContextMenu = (e: React.MouseEvent, message: Message) => {
    e.preventDefault();
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    
    // แสดง context menu สำหรับข้อความของตัวเอง (ลบข้อความ)
    if (message.is_me) {
      setContextMenu({
        visible: true,
        x: rect.left + rect.width / 2,
        y: rect.top,
        message
      });
    } else {
      // แสดง context menu สำหรับข้อความของผู้อื่น (รายงานข้อความ)
      setContextMenu({
        visible: true,
        x: rect.left + rect.width / 2,
        y: rect.top,
        message
      });
    }
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, message: null });
  };

  // Content Moderation Functions - ปิดชั่วคราว
  /*
  const handleReportMessage = (message: Message) => {
    setMessageToReport(message);
    setShowReportModal(true);
    closeContextMenu();
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setMessageToReport(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowImageGuard(true);
    }
  };

  const confirmImageUpload = () => {
    if (selectedFile) {
      setShowImageGuard(false);
      // Continue with original image upload logic
      handleImageUpload(selectedFile);
    }
  };

  const cancelImageUpload = () => {
    setShowImageGuard(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  */

  const handleDeleteFromContextMenu = () => {
    if (contextMenu.message) {
      openDeleteModal(contextMenu.message);
      closeContextMenu();
    }
  };

  // Long press handlers for mobile
  let longPressTimer: NodeJS.Timeout | null = null;

  const handleTouchStart = (e: React.TouchEvent, message: Message) => {
    // Allow long press for both own messages (delete) and others' messages (report)
    longPressTimer = setTimeout(() => {
      const touch = e.touches[0];
      setContextMenu({
        visible: true,
        x: touch.clientX,
        y: touch.clientY,
        message
      });
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };

  const handleTouchMove = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gray-900 sm:bg-gray-100 flex items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-2xl h-[100dvh] sm:h-[90vh] sm:rounded-2xl sm:shadow-2xl bg-white flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white shadow-sm px-3 sm:px-4 py-3 flex items-center justify-between sticky top-0 z-10 border-b border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              onClick={() => navigate("/")} 
              variant="ghost" 
              size="sm" 
              className="p-2 text-gray-500 hover:bg-gray-100 min-w-[44px] min-h-[44px] sm:min-w-[40px] sm:min-h-[40px]"
            >
              <ArrowLeft className="w-5 h-5 sm:w-5 sm:h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <h1 className="text-lg font-semibold text-gray-800">แชทสาธารณะ</h1>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            ออนไลน์: {messages.length} คน
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 bg-gray-50" onClick={closeContextMenu}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={message.id} className="flex items-start gap-2">
                {!message.is_me && (
                  <div className="flex items-start gap-2 max-w-[80%] sm:max-w-[70%]">
                    {/* Avatar ของคนอื่น */}
                    <div 
                      className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
                      onClick={() => navigate(`/profile/${message.user_id}`)}
                    >
                      {message.avatar_url ? (
                        <img 
                          src={message.avatar_url} 
                          alt={message.sender_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-medium text-gray-600">
                          {message.sender_name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-600 mb-1 flex items-center gap-2">
                        <span 
                          className="hover:text-blue-600 cursor-pointer transition-colors"
                          onClick={() => navigate(`/profile/${message.user_id}`)}
                        >
                          {message.sender_name}
                        </span>
                        {message.instrument && (
                          <span 
                            className="inline-block px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full cursor-pointer hover:bg-orange-200 transition-colors"
                            onClick={() => navigate(`/profile/${message.user_id}`)}
                          >
                            [{message.instrument}]
                          </span>
                        )}
                        {!message.instrument && message.role && (
                          <span 
                            className="inline-block px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full cursor-pointer hover:bg-orange-200 transition-colors"
                            onClick={() => navigate(`/profile/${message.user_id}`)}
                          >
                            [{message.role}]
                          </span>
                        )}
                        {!message.instrument && !message.role && (
                          <span 
                            className="inline-block px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full cursor-pointer hover:bg-orange-200 transition-colors"
                            onClick={() => navigate(`/profile/${message.user_id}`)}
                          >
                            [สมาชิก]
                          </span>
                        )}
                      </div>
                      <div className="relative inline-block">
                        {/* ติ่งกล่องซ้าย - แสดงเฉพาะเมื่อมีข้อความเท่านั้น */}
                        {message.text && (
                          <div className="absolute left-0 top-2 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-white"></div>
                        )}
                        {/* กล่องข้อความ - มีพื้นหลังเฉพาะเมื่อมีข้อความ */}
                        {message.text ? (
                          <div 
                            className="bg-white rounded-2xl rounded-tl-none px-3 sm:px-4 py-2 shadow-sm"
                            onContextMenu={(e) => handleContextMenu(e, message)}
                            onTouchStart={(e) => handleTouchStart(e, message)}
                            onTouchEnd={handleTouchEnd}
                            onTouchMove={handleTouchMove}
                          >
                            <p className="text-sm text-gray-800">{message.text}</p>
                            {/* แสดงรูปภาพถ้ามี (กรณีมีทั้งข้อความและรูปภาพ) */}
                            {message.image_url && (
                              <div className="mt-2">
                                <img 
                                  src={message.image_url} 
                                  alt="รูปภาพในแชท"
                                  className="max-w-xs sm:max-w-sm rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(message.image_url, '_blank');
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          /* กรณีมีแต่รูปภาพ - กล่องโปร่งแสงไม่มี padding */
                          <div 
                            className="relative"
                            onContextMenu={(e) => handleContextMenu(e, message)}
                            onTouchStart={(e) => handleTouchStart(e, message)}
                            onTouchEnd={handleTouchEnd}
                            onTouchMove={handleTouchMove}
                          >
                            {/* ไม่มีติ่งกล่องและไม่มีพื้นหลัง */}
                            <img 
                              src={message.image_url} 
                              alt="รูปภาพในแชท"
                              className="max-w-xs sm:max-w-sm rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(message.image_url, '_blank');
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 px-1">{message.time}</p>
                    </div>
                  </div>
                )}
                
                {message.is_me && (
                  <div className="flex items-end gap-2 max-w-[80%] sm:max-w-[70%] ml-auto">
                    <div className="text-right">
                      <div className="relative inline-block">
                        {/* ติ่งกล่องขวา - แสดงเฉพาะเมื่อมีข้อความเท่านั้น */}
                        {message.text && (
                          <div className="absolute right-0 top-2 w-0 h-0 border-t-8 border-t-transparent border-l-8 border-l-orange-500"></div>
                        )}
                        {/* กล่องข้อความ - มีพื้นหลังเฉพาะเมื่อมีข้อความ */}
                        {message.text ? (
                          <div 
                            className="bg-orange-500 rounded-2xl rounded-tr-none px-3 sm:px-4 py-2 shadow-sm"
                            onContextMenu={(e) => handleContextMenu(e, message)}
                            onTouchStart={(e) => handleTouchStart(e, message)}
                            onTouchEnd={handleTouchEnd}
                            onTouchMove={handleTouchMove}
                          >
                            <p className="text-sm text-white">{message.text}</p>
                            {/* แสดงรูปภาพถ้ามี (กรณีมีทั้งข้อความและรูปภาพ) */}
                            {message.image_url && (
                              <div className="mt-2">
                                <img 
                                  src={message.image_url} 
                                  alt="รูปภาพในแชท"
                                  className="max-w-xs sm:max-w-sm rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(message.image_url, '_blank');
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          /* กรณีมีแต่รูปภาพ - กล่องโปร่งแสงไม่มี padding */
                          <div 
                            className="relative"
                            onContextMenu={(e) => handleContextMenu(e, message)}
                            onTouchStart={(e) => handleTouchStart(e, message)}
                            onTouchEnd={handleTouchEnd}
                            onTouchMove={handleTouchMove}
                          >
                            {/* ไม่มีติ่งกล่องและไม่มีพื้นหลัง */}
                            <img 
                              src={message.image_url} 
                              alt="รูปภาพในแชท"
                              className="max-w-xs sm:max-w-sm rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(message.image_url, '_blank');
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 px-1">{message.time}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && messageToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ยืนยันการลบข้อความ
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                คุณต้องการลบข้อความนี้หรือไม่? การลบข้อความจะไม่สามารถกู้คืนได้
                {messageToDelete.image_url && (
                  <span className="block mt-1 text-red-600">
                    รูปภาพที่แนบมาจะถูกลบไปด้วย
                  </span>
                )}
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={closeDeleteModal}
                  disabled={deletingMessage === messageToDelete.id}
                >
                  ยกเลิก
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteMessage(messageToDelete)}
                  disabled={deletingMessage === messageToDelete.id}
                >
                  {deletingMessage === messageToDelete.id ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      กำลังลบ...
                    </div>
                  ) : (
                    'ลบข้อความ'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Context Menu */}
        {contextMenu.visible && (
          <div
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[150px]"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              transform: 'translateX(-50%)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.message?.is_me ? (
              // Menu for own messages - Delete option
              <button
                onClick={handleDeleteFromContextMenu}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                ยกเลิกข้อความ
              </button>
            ) : (
              // Menu for others' messages - Report option (ปิดชั่วคราว)
              null
            )}
          </div>
        )}

        {/* Backdrop for context menu */}
        {contextMenu.visible && (
          <div
            className="fixed inset-0 z-40"
            onClick={closeContextMenu}
          />
        )}

        {/* Input Bar */}
        {/* Input Disclaimer - ปิดชั่วคราว */}
        {/* <InputDisclaimer /> */}
        
        <div className="bg-white border-t border-gray-200 px-3 sm:px-4 py-3 sticky bottom-0 z-30">
          <div className="flex items-center gap-2 sm:gap-2">
            {/* ไอคอนซ้าย */}
            <div className="flex items-center gap-1 sm:gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 text-gray-500 hover:bg-gray-100 min-w-[44px] min-h-[44px] sm:min-w-[40px] sm:min-h-[40px]"
              >
                <Plus className="w-5 h-5 sm:w-5 sm:h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 text-gray-500 hover:bg-gray-100 min-w-[44px] min-h-[44px] sm:min-w-[40px] sm:min-h-[40px]"
                onClick={handleImageClick}
                disabled={uploadingImage}
              >
                <Image className="w-5 h-5 sm:w-5 sm:h-5" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Input Field */}
            <div className="flex-1 min-w-0">
              <Input
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="พิมพ์ข้อความ..."
                className="border-gray-300 rounded-full focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-sm"
                disabled={uploadingImage}
              />
            </div>

            {/* Refresh Chat Button */}
            <Button 
              variant="outline"
              onClick={() => {
                console.log('🔄 Manual refresh triggered');
                setMessages([]);
                // รีเฟรชข้อมูลโดยเรียก fetchMessages ใหม่
                const refreshMessages = async () => {
                  console.log('🚀 refreshMessages function called');
                  console.log('📥 Refreshing messages...');
                  console.log('🆔 Current user ID:', currentUser?.id);
                  console.log('⏰ Refresh time:', new Date().toLocaleTimeString());
                  
                  // ✅ ล้างข้อมูลเก่าก่อน refresh
                  console.log('🧹 Clearing messages for refresh...');
                  setMessages([]);
                  
                  try {
                    // ดึงข้อมูลแบบ Left Join ที่ปลอดภัย
                    console.log('📡 Executing refresh query with safe Left Join...');
                    
                    const result = await supabase
                      .from('public_chats')
                      .select(`
                        *,
                        profiles:user_id (
                          full_name,
                          avatar_url,
                          instrument,
                          instruments,
                          role
                        )
                      `)
                      .order('created_at', { ascending: true })
                      .limit(50);
                    
                    if (result.error) {
                      console.error('❌ Refresh query error:', result.error);
                      toast({
                        title: "รีเฟรชข้อความไม่สำเร็จ",
                        description: result.error.message,
                        variant: "destructive"
                      });
                      return;
                    }
                    
                    console.log('✅ Refresh query successful:', result.data?.length, 'messages');
                    
                    // แปลงข้อมูลให้ถูก format
                    const formattedMessages = result.data.map((msg: any) => ({
                      id: msg.id,
                      sender_name: msg.profiles?.full_name || 'ผู้ใช้ทั่วไป',
                      text: msg.content,
                      time: new Date(msg.created_at).toLocaleTimeString("th-TH", { 
                        hour: "2-digit", 
                        minute: "2-digit" 
                      }),
                      is_me: msg.user_id === currentUser?.id,
                      avatar_url: msg.profiles?.avatar_url,
                      user_id: msg.user_id,
                      image_url: msg.image_url,
                      instrument: msg.profiles?.instruments || msg.profiles?.instrument || 'ไม่ระบุ',
                      role: msg.profiles?.role || 'สมาชิก'
                    }));
                    
                    console.log('📝 Formatted refresh messages:', formattedMessages.length);
                    setMessages(formattedMessages);
                    
                    toast({
                      title: "รีเฟรชข้อความสำเร็จ",
                      description: `โหลดข้อความ ${formattedMessages.length} ข้อความ`,
                    });
                    
                  } catch (error) {
                    console.error('❌ Refresh error:', error);
                    toast({
                      title: "รีเฟรชข้อความไม่สำเร็จ",
                      description: error.message,
                      variant: "destructive"
                    });
                  }
                };
                
                refreshMessages();
              }}
              size="sm"
              className="p-2 min-w-[44px] min-h-[44px] sm:min-w-[40px] sm:min-h-[40px]"
              title="รีเฟรชข้อความ"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            {/* Send Button */}
            <Button 
              onClick={handleSendMessage}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-white p-2 min-w-[44px] min-h-[44px] sm:min-w-[40px] sm:min-h-[40px]"
              disabled={!inputText.trim() && !uploadingImage}
            >
              {uploadingImage ? (
                <div className="animate-spin w-4 h-4 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <Send className="w-4 h-4 sm:w-4 sm:h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Report Modal - ปิดชั่วคราว */}
        {/* {showReportModal && messageToReport && (
          <ReportModal
            isOpen={showReportModal}
            onClose={closeReportModal}
            message={messageToReport}
            currentUser={currentUser}
          />
        )} */}

        {/* Image Upload Guard - ปิดชั่วคราว */}
        {/* {showImageGuard && (
          <ImageUploadGuard
            isOpen={showImageGuard}
            onClose={cancelImageUpload}
            onConfirm={confirmImageUpload}
            isUploading={uploadingImage}
          />
        )} */}
      </div>
    </div>
  );
};

export default PublicChat;
