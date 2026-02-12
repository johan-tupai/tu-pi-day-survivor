
CREATE TABLE public.tupai_survivor_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  enemies_killed INTEGER NOT NULL DEFAULT 0,
  time_survived INTEGER NOT NULL DEFAULT 0,
  level_reached INTEGER NOT NULL DEFAULT 1,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tupai_survivor_scores ENABLE ROW LEVEL SECURITY;

-- Anyone can view scores (public leaderboard)
CREATE POLICY "Anyone can view scores"
  ON public.tupai_survivor_scores
  FOR SELECT
  USING (true);

-- Anyone can insert scores (no auth required for arcade game)
CREATE POLICY "Anyone can insert scores"
  ON public.tupai_survivor_scores
  FOR INSERT
  WITH CHECK (true);
