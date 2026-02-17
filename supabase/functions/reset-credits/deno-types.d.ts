// Deno types for Supabase Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Request type
interface Request {
  method: string;
  json(): Promise<any>;
}

// Response type
interface ResponseInit {
  status?: number;
  headers?: Record<string, string>;
}

declare const Response: {
  new(body: string | Uint8Array, init?: ResponseInit): Response;
};

// Supabase client types
interface SupabaseClient {
  from(table: string): any;
}

declare const createClient: (url: string, key: string) => SupabaseClient;
