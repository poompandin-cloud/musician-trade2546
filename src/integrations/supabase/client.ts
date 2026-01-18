import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgsdwlrasnsxkqsypdil.supabase.co';
// 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nc2R3bHJhc25zeGtxc3lwZGlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY4NjgsImV4cCI6MjA4NDI3Mjg2OH0.ZUT_8k8J1-dMlu0X7tEMdzDsrg3pruPgjYSdBNvJApY'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);