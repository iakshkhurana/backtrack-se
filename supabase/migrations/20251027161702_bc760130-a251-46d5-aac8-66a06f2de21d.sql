-- Create enum for item categories
CREATE TYPE item_category AS ENUM ('phone', 'keys', 'stationery', 'electronics', 'wallet', 'clothing', 'other');

-- Create enum for item status
CREATE TYPE item_status AS ENUM ('lost', 'found');

-- Create items table
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category item_category NOT NULL,
  status item_status NOT NULL,
  location TEXT,
  date_reported TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  image_url TEXT,
  contact_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view items"
  ON public.items
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create items"
  ON public.items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
  ON public.items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
  ON public.items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();