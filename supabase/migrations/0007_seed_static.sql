-- 0007_seed_static.sql — Static seeds: categories, merchants, shop items
-- Idempotent: uses on conflict do nothing.

insert into public.categories (slug, name_en, name_zh, icon, color, ord) values
  ('transport', 'Transport', '交通', 'bus', '#7AB7E8', 10),
  ('groceries', 'Groceries', '買餸', 'shopping-basket', '#7DC383', 20),
  ('snacks',    'Snacks',    '零食', 'cookie',          '#F4B860', 30),
  ('food',      'Food',      '食飯', 'utensils',        '#E76F51', 40),
  ('toys',      'Toys',      '玩具', 'toy-brick',       '#C77DFF', 50),
  ('books',     'Books',     '書本', 'book-open',       '#9381FF', 60),
  ('health',    'Health',    '健康', 'cross',           '#06AED5', 70),
  ('shopping',  'Shopping',  '購物', 'shopping-bag',    '#F18FAA', 80),
  ('other',     'Other',     '其他', 'circle',          '#8D99AE', 99)
on conflict (slug) do nothing;

-- HK merchant KB
insert into public.merchants_kb (name_normalized, display_name_en, display_name_zh, default_category_id, aliases) values
  ('parknshop',     'ParknShop',         '百佳',       (select id from public.categories where slug='groceries'), array['百佳','PnS','PARKnSHOP','PARKNSHOP']),
  ('wellcome',      'Wellcome',          '惠康',       (select id from public.categories where slug='groceries'), array['惠康']),
  ('7-eleven',      '7-Eleven',          '7-Eleven',  (select id from public.categories where slug='snacks'),    array['7仔','七仔','seven','7-11','7 11','SEVEN ELEVEN']),
  ('circle k',      'Circle K',          'OK便利店',  (select id from public.categories where slug='snacks'),    array['OK便利店','OKCircleK','CircleK']),
  ('mtr',           'MTR',               '港鐵',       (select id from public.categories where slug='transport'), array['港鐵','MTR Corp','地鐵']),
  ('octopus',       'Octopus',           '八達通',     (select id from public.categories where slug='transport'), array['八達通']),
  ('kfc',           'KFC',               '肯德基',     (select id from public.categories where slug='food'),     array['肯德基']),
  ('mcdonalds',     'McDonald''s',       '麥當勞',     (select id from public.categories where slug='food'),     array['麥當勞','M記','McD','麥記']),
  ('cafe de coral', 'Cafe de Coral',     '大家樂',     (select id from public.categories where slug='food'),     array['大家樂']),
  ('starbucks',     'Starbucks',         '星巴克',     (select id from public.categories where slug='food'),     array['星巴克']),
  ('popular',       'Popular Bookstore', '大眾書局',   (select id from public.categories where slug='books'),    array['大眾書局','Popular']),
  ('toysrus',       'Toys"R"Us',         '玩具反斗城', (select id from public.categories where slug='toys'),     array['玩具反斗城','Toys R Us']),
  ('watsons',       'Watsons',           '屈臣氏',     (select id from public.categories where slug='health'),   array['屈臣氏']),
  ('mannings',      'Mannings',          '萬寧',       (select id from public.categories where slug='health'),   array['萬寧']),
  ('hktvmall',      'HKTVmall',          'HKTV',      (select id from public.categories where slug='shopping'), array['HKTV','hktv mall'])
on conflict (name_normalized) do nothing;

-- Shop items (sprites referenced via /shop bucket; use placeholder URLs for now)
insert into public.shop_items (sku, kind, name_en, name_zh, price_coins, rarity) values
  ('hat-straw',      'hat',       'Straw Hat',      '草帽',      30,  1),
  ('hat-graduation', 'hat',       'Graduation Cap', '畢業帽',    100, 3),
  ('shirt-school',   'shirt',     'School Tee',     '校服 T 恤', 40,  1),
  ('shirt-rainbow',  'shirt',     'Rainbow Shirt',  '彩虹衫',    80,  2),
  ('acc-bowtie',     'accessory', 'Bow Tie',        '蝴蝶結',    25,  1),
  ('bg-park',        'background','Victoria Park',  '維多利亞公園', 60, 2),
  ('bg-beach',       'background','Repulse Bay',    '淺水灣',    90,  2),
  ('mat-bamboo',     'material',  'Bamboo',         '竹子',      10,  1),
  ('mat-lettuce',    'material',  'Lettuce',        '生菜',      15,  1)
on conflict (sku) do nothing;
