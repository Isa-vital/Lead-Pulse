<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Lead;
use App\Models\PipelineStage;
use App\Models\Interaction;
use App\Models\EmailTemplate;
use App\Models\ActivityLog;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding categories...');
        $categories = $this->seedCategories();

        $this->command->info('Seeding products...');
        $products = $this->seedProducts($categories);

        $this->command->info('Seeding customers...');
        $customers = $this->seedCustomers();

        $this->command->info('Seeding orders...');
        $orders = $this->seedOrders($customers, $products);

        $this->command->info('Seeding leads...');
        $leads = $this->seedLeads($customers);

        $this->command->info('Seeding interactions...');
        $this->seedInteractions($customers, $leads);

        $this->command->info('Seeding email templates...');
        $this->seedEmailTemplates();

        $this->command->info('Seeding activity logs...');
        $this->seedActivityLogs();

        $this->command->info('Demo data seeded successfully!');
    }

    private function seedCategories(): array
    {
        $cats = [
            ['name' => 'Electronics', 'slug' => 'electronics', 'description' => 'Electronic devices and accessories', 'sort_order' => 1],
            ['name' => 'Clothing', 'slug' => 'clothing', 'description' => 'Apparel and fashion items', 'sort_order' => 2],
            ['name' => 'Home & Kitchen', 'slug' => 'home-kitchen', 'description' => 'Home appliances and kitchen utensils', 'sort_order' => 3],
            ['name' => 'Books', 'slug' => 'books', 'description' => 'Physical and digital books', 'sort_order' => 4],
            ['name' => 'Food & Beverages', 'slug' => 'food-beverages', 'description' => 'Local and imported food items', 'sort_order' => 5],
            ['name' => 'Health & Beauty', 'slug' => 'health-beauty', 'description' => 'Personal care and beauty products', 'sort_order' => 6],
            ['name' => 'Sports & Outdoors', 'slug' => 'sports-outdoors', 'description' => 'Sporting goods and equipment', 'sort_order' => 7],
            ['name' => 'Automotive', 'slug' => 'automotive', 'description' => 'Car parts and accessories', 'sort_order' => 8],
        ];

        $result = [];
        foreach ($cats as $cat) {
            $result[] = Category::firstOrCreate(['slug' => $cat['slug']], $cat);
        }

        // Sub-categories
        $electronics = $result[0];
        $subs = [
            ['name' => 'Smartphones', 'slug' => 'smartphones', 'parent_id' => $electronics->id, 'sort_order' => 1],
            ['name' => 'Laptops', 'slug' => 'laptops', 'parent_id' => $electronics->id, 'sort_order' => 2],
            ['name' => 'Accessories', 'slug' => 'accessories', 'parent_id' => $electronics->id, 'sort_order' => 3],
        ];
        foreach ($subs as $sub) {
            $result[] = Category::firstOrCreate(['slug' => $sub['slug']], $sub);
        }

        return $result;
    }

    private function seedProducts(array $categories): array
    {
        $products = [
            // Electronics
            ['category' => 0, 'name' => 'Samsung Galaxy A54', 'sku' => 'ELEC-001', 'price' => 1500000, 'cost' => 1200000, 'stock' => 45, 'low_stock_threshold' => 10, 'description' => '128GB, 6GB RAM, 5000mAh battery'],
            ['category' => 0, 'name' => 'Techno Spark 20', 'sku' => 'ELEC-002', 'price' => 650000, 'cost' => 480000, 'stock' => 80, 'low_stock_threshold' => 15, 'description' => '64GB, 4GB RAM, Android 13'],
            ['category' => 0, 'name' => 'HP Laptop 15s', 'sku' => 'ELEC-003', 'price' => 2800000, 'cost' => 2300000, 'stock' => 12, 'low_stock_threshold' => 5, 'description' => 'Intel i5, 8GB RAM, 256GB SSD'],
            ['category' => 0, 'name' => 'JBL Flip 6 Speaker', 'sku' => 'ELEC-004', 'price' => 450000, 'cost' => 320000, 'stock' => 30, 'low_stock_threshold' => 8, 'description' => 'Portable Bluetooth speaker, IP67 waterproof'],
            ['category' => 0, 'name' => 'Oraimo Earbuds', 'sku' => 'ELEC-005', 'price' => 85000, 'cost' => 45000, 'stock' => 150, 'low_stock_threshold' => 20, 'description' => 'True wireless earbuds with noise cancellation'],
            ['category' => 0, 'name' => 'Sony 43" Smart TV', 'sku' => 'ELEC-006', 'price' => 1800000, 'cost' => 1400000, 'stock' => 8, 'low_stock_threshold' => 3, 'description' => '4K UHD, Android TV, HDR'],
            ['category' => 0, 'name' => 'Power Bank 20000mAh', 'sku' => 'ELEC-007', 'price' => 120000, 'cost' => 65000, 'stock' => 200, 'low_stock_threshold' => 25, 'description' => 'Fast charging, dual USB-C ports'],
            ['category' => 0, 'name' => 'USB-C Charger 65W', 'sku' => 'ELEC-008', 'price' => 75000, 'cost' => 35000, 'stock' => 3, 'low_stock_threshold' => 10, 'description' => 'GaN fast charger, compatible with laptops'],

            // Clothing
            ['category' => 1, 'name' => 'African Print Shirt', 'sku' => 'CLO-001', 'price' => 85000, 'cost' => 35000, 'stock' => 60, 'low_stock_threshold' => 10, 'description' => 'Traditional Kitenge fabric, various sizes'],
            ['category' => 1, 'name' => 'Denim Jeans', 'sku' => 'CLO-002', 'price' => 120000, 'cost' => 65000, 'stock' => 40, 'low_stock_threshold' => 8, 'description' => 'Slim fit, multiple colors available'],
            ['category' => 1, 'name' => 'Polo T-Shirt', 'sku' => 'CLO-003', 'price' => 55000, 'cost' => 25000, 'stock' => 100, 'low_stock_threshold' => 15, 'description' => 'Cotton blend, assorted colors'],
            ['category' => 1, 'name' => 'Business Suit', 'sku' => 'CLO-004', 'price' => 350000, 'cost' => 180000, 'stock' => 15, 'low_stock_threshold' => 5, 'description' => 'Two-piece suit, tailored fit'],

            // Home & Kitchen
            ['category' => 2, 'name' => 'Blender 1.5L', 'sku' => 'HK-001', 'price' => 180000, 'cost' => 95000, 'stock' => 25, 'low_stock_threshold' => 5, 'description' => 'Heavy duty motor, glass jar'],
            ['category' => 2, 'name' => 'Non-stick Cookware Set', 'sku' => 'HK-002', 'price' => 250000, 'cost' => 140000, 'stock' => 18, 'low_stock_threshold' => 5, 'description' => '7-piece set with lids'],
            ['category' => 2, 'name' => 'Water Dispenser', 'sku' => 'HK-003', 'price' => 450000, 'cost' => 300000, 'stock' => 10, 'low_stock_threshold' => 3, 'description' => 'Hot & cold water, bottom loading'],
            ['category' => 2, 'name' => 'Microwave Oven 20L', 'sku' => 'HK-004', 'price' => 380000, 'cost' => 250000, 'stock' => 7, 'low_stock_threshold' => 3, 'description' => 'Digital controls, grill function'],

            // Books
            ['category' => 3, 'name' => 'The Pearl of Africa Guide', 'sku' => 'BK-001', 'price' => 45000, 'cost' => 15000, 'stock' => 50, 'low_stock_threshold' => 5, 'description' => 'Travel and culture guide for Uganda'],
            ['category' => 3, 'name' => 'Business Management 101', 'sku' => 'BK-002', 'price' => 65000, 'cost' => 25000, 'stock' => 35, 'low_stock_threshold' => 5, 'description' => 'Comprehensive business principles textbook'],

            // Food & Beverages
            ['category' => 4, 'name' => 'Ugandan Coffee (1kg)', 'sku' => 'FB-001', 'price' => 45000, 'cost' => 25000, 'stock' => 100, 'low_stock_threshold' => 20, 'description' => 'Premium Arabica coffee beans from Mt. Elgon'],
            ['category' => 4, 'name' => 'Dried Fruits Mix', 'sku' => 'FB-002', 'price' => 35000, 'cost' => 18000, 'stock' => 60, 'low_stock_threshold' => 15, 'description' => 'Assorted dried tropical fruits, 500g pack'],

            // Health & Beauty
            ['category' => 5, 'name' => 'Shea Butter Cream', 'sku' => 'HB-001', 'price' => 25000, 'cost' => 10000, 'stock' => 80, 'low_stock_threshold' => 15, 'description' => 'Natural unrefined shea butter, 250ml'],
            ['category' => 5, 'name' => 'Essential Oil Set', 'sku' => 'HB-002', 'price' => 95000, 'cost' => 45000, 'stock' => 30, 'low_stock_threshold' => 8, 'description' => 'Set of 6 pure essential oils'],

            // Sports
            ['category' => 6, 'name' => 'Football (Size 5)', 'sku' => 'SP-001', 'price' => 85000, 'cost' => 40000, 'stock' => 40, 'low_stock_threshold' => 8, 'description' => 'FIFA quality, hand-stitched'],
            ['category' => 6, 'name' => 'Yoga Mat', 'sku' => 'SP-002', 'price' => 65000, 'cost' => 28000, 'stock' => 25, 'low_stock_threshold' => 5, 'description' => 'Non-slip, 6mm thickness, carrying strap'],

            // Automotive
            ['category' => 7, 'name' => 'Car Phone Mount', 'sku' => 'AU-001', 'price' => 35000, 'cost' => 12000, 'stock' => 70, 'low_stock_threshold' => 10, 'description' => 'Universal dashboard mount, 360° rotation'],
            ['category' => 7, 'name' => 'Tyre Inflator', 'sku' => 'AU-002', 'price' => 150000, 'cost' => 80000, 'stock' => 20, 'low_stock_threshold' => 5, 'description' => 'Portable digital air pump, 12V'],
        ];

        $result = [];
        foreach ($products as $p) {
            $catIndex = $p['category'];
            unset($p['category']);
            $p['category_id'] = $categories[$catIndex]->id;
            $p['slug'] = Str::slug($p['name']);
            $p['is_active'] = true;
            $p['images'] = [];
            $p['attributes'] = [];
            $p['tags'] = [];
            $result[] = Product::firstOrCreate(['sku' => $p['sku']], $p);
        }

        return $result;
    }

    private function seedCustomers(): array
    {
        $customers = [
            ['name' => 'Nakato Sarah', 'email' => 'sarah.nakato@gmail.com', 'phone' => '+256701234567', 'company' => 'Kampala Traders Ltd', 'source' => 'website', 'address' => ['street' => 'Plot 45, Bombo Road', 'city' => 'Kampala', 'state' => 'Central', 'country' => 'Uganda']],
            ['name' => 'Ochieng David', 'email' => 'david.ochieng@outlook.com', 'phone' => '+256772345678', 'company' => 'Lake Victoria Imports', 'source' => 'referral', 'address' => ['street' => '12 Oginga Odinga St', 'city' => 'Jinja', 'state' => 'Eastern', 'country' => 'Uganda']],
            ['name' => 'Atim Grace', 'email' => 'grace.atim@yahoo.com', 'phone' => '+256753456789', 'company' => null, 'source' => 'social_media', 'address' => ['street' => 'Gulu Main Street', 'city' => 'Gulu', 'state' => 'Northern', 'country' => 'Uganda']],
            ['name' => 'Mugisha Brian', 'email' => 'brian.mugisha@gmail.com', 'phone' => '+256784567890', 'company' => 'Ankole Supplies Co', 'source' => 'cold_call', 'address' => ['street' => 'High Street 8', 'city' => 'Mbarara', 'state' => 'Western', 'country' => 'Uganda']],
            ['name' => 'Nansubuga Patricia', 'email' => 'patricia.n@hotmail.com', 'phone' => '+256705678901', 'company' => 'Entebbe Fashion House', 'source' => 'website', 'address' => ['street' => 'Church Road 23', 'city' => 'Entebbe', 'state' => 'Central', 'country' => 'Uganda']],
            ['name' => 'Kato Joseph', 'email' => 'joseph.kato@gmail.com', 'phone' => '+256776789012', 'company' => null, 'source' => 'referral', 'address' => ['street' => 'Luwum Street', 'city' => 'Kampala', 'state' => 'Central', 'country' => 'Uganda']],
            ['name' => 'Apio Rebecca', 'email' => 'rebecca.apio@gmail.com', 'phone' => '+256757890123', 'company' => 'Soroti Electronics', 'source' => 'trade_show', 'address' => ['street' => 'Market Square', 'city' => 'Soroti', 'state' => 'Eastern', 'country' => 'Uganda']],
            ['name' => 'Ssempijja Moses', 'email' => 'moses.s@gmail.com', 'phone' => '+256708901234', 'company' => 'Masaka Hardware', 'source' => 'website', 'address' => ['street' => '5 Industrial Area', 'city' => 'Masaka', 'state' => 'Central', 'country' => 'Uganda']],
            ['name' => 'Namukasa Fatimah', 'email' => 'fatimah.n@gmail.com', 'phone' => '+256779012345', 'company' => null, 'source' => 'social_media', 'address' => ['street' => 'William Street', 'city' => 'Kampala', 'state' => 'Central', 'country' => 'Uganda']],
            ['name' => 'Otim Peter', 'email' => 'peter.otim@outlook.com', 'phone' => '+256750123456', 'company' => 'Lira Sports Shop', 'source' => 'referral', 'address' => ['street' => 'Railway Lane 3', 'city' => 'Lira', 'state' => 'Northern', 'country' => 'Uganda']],
            ['name' => 'Babirye Joan', 'email' => 'joan.babirye@gmail.com', 'phone' => '+256701122334', 'company' => 'Twin City Boutique', 'source' => 'website', 'address' => ['street' => 'Namirembe Road', 'city' => 'Kampala', 'state' => 'Central', 'country' => 'Uganda']],
            ['name' => 'Muwanga Charles', 'email' => 'charles.muwanga@gmail.com', 'phone' => '+256772233445', 'company' => 'Lugazi Coffee Co', 'source' => 'trade_show', 'address' => ['street' => 'Plantation Rd', 'city' => 'Lugazi', 'state' => 'Central', 'country' => 'Uganda']],
            ['name' => 'Kyomuhendo Diana', 'email' => 'diana.k@yahoo.com', 'phone' => '+256753344556', 'company' => null, 'source' => 'cold_call', 'address' => ['street' => 'Fort Portal Rd', 'city' => 'Fort Portal', 'state' => 'Western', 'country' => 'Uganda']],
            ['name' => 'Lubega Alex', 'email' => 'alex.lubega@gmail.com', 'phone' => '+256784455667', 'company' => 'Mukono Wholesale', 'source' => 'website', 'address' => ['street' => '15 Main Street', 'city' => 'Mukono', 'state' => 'Central', 'country' => 'Uganda']],
            ['name' => 'Among Rose', 'email' => 'rose.among@gmail.com', 'phone' => '+256705566778', 'company' => null, 'source' => 'social_media', 'address' => ['street' => 'Arua Park', 'city' => 'Arua', 'state' => 'West Nile', 'country' => 'Uganda']],
            ['name' => 'Wandera Samuel', 'email' => 'samuel.w@outlook.com', 'phone' => '+256776677889', 'company' => 'Mbale Tech Solutions', 'source' => 'referral', 'address' => ['street' => 'Republic St', 'city' => 'Mbale', 'state' => 'Eastern', 'country' => 'Uganda']],
            ['name' => 'Nalwoga Esther', 'email' => 'esther.nalwoga@gmail.com', 'phone' => '+256757788990', 'company' => null, 'source' => 'website', 'address' => ['street' => 'Gayaza Road', 'city' => 'Kampala', 'state' => 'Central', 'country' => 'Uganda']],
            ['name' => 'Ojok Emmanuel', 'email' => 'emmanuel.ojok@gmail.com', 'phone' => '+256708899001', 'company' => 'Kitgum Enterprises', 'source' => 'cold_call', 'address' => ['street' => 'Market Street', 'city' => 'Kitgum', 'state' => 'Northern', 'country' => 'Uganda']],
            ['name' => 'Tumusiime Francis', 'email' => 'francis.t@gmail.com', 'phone' => '+256779900112', 'company' => 'Kabale Agro Dealers', 'source' => 'trade_show', 'address' => ['street' => 'Kabale Town', 'city' => 'Kabale', 'state' => 'Western', 'country' => 'Uganda']],
            ['name' => 'Nassali Irene', 'email' => 'irene.nassali@hotmail.com', 'phone' => '+256750011223', 'company' => null, 'source' => 'social_media', 'address' => ['street' => 'Ggaba Road', 'city' => 'Kampala', 'state' => 'Central', 'country' => 'Uganda']],
            ['name' => 'Byaruhanga Martin', 'email' => 'martin.b@gmail.com', 'phone' => '+256701234000', 'company' => 'Hoima Distributors', 'source' => 'referral', 'address' => ['street' => 'Oil City Road', 'city' => 'Hoima', 'state' => 'Western', 'country' => 'Uganda']],
            ['name' => 'Namutebi Sylvia', 'email' => 'sylvia.namutebi@gmail.com', 'phone' => '+256772345000', 'company' => null, 'source' => 'website', 'address' => ['street' => 'Ntinda Road', 'city' => 'Kampala', 'state' => 'Central', 'country' => 'Uganda']],
            ['name' => 'Okello Timothy', 'email' => 'timothy.okello@yahoo.com', 'phone' => '+256753456000', 'company' => 'Tororo Trading Co', 'source' => 'cold_call', 'address' => ['street' => 'Border Road', 'city' => 'Tororo', 'state' => 'Eastern', 'country' => 'Uganda']],
            ['name' => 'Nankya Ruth', 'email' => 'ruth.nankya@gmail.com', 'phone' => '+256784567000', 'company' => 'Mityana Fashions', 'source' => 'social_media', 'address' => ['street' => 'Central Ave', 'city' => 'Mityana', 'state' => 'Central', 'country' => 'Uganda']],
            ['name' => 'Mukiibi Daniel', 'email' => 'daniel.mukiibi@gmail.com', 'phone' => '+256705678000', 'company' => null, 'source' => 'website', 'address' => ['street' => 'Bukoto Hill', 'city' => 'Kampala', 'state' => 'Central', 'country' => 'Uganda']],
            ['name' => 'Achola Catherine', 'email' => 'catherine.achola@outlook.com', 'phone' => '+256776789000', 'company' => 'Pader Organics', 'source' => 'trade_show', 'address' => ['street' => 'Parish Road', 'city' => 'Pader', 'state' => 'Northern', 'country' => 'Uganda']],
            ['name' => 'Ssekandi Paul', 'email' => 'paul.ssekandi@gmail.com', 'phone' => '+256757890000', 'company' => 'Kayunga Supplies', 'source' => 'referral', 'address' => ['street' => 'Town Center', 'city' => 'Kayunga', 'state' => 'Central', 'country' => 'Uganda']],
            ['name' => 'Adong Mercy', 'email' => 'mercy.adong@gmail.com', 'phone' => '+256708901000', 'company' => null, 'source' => 'website', 'address' => ['street' => 'Moroto Lane', 'city' => 'Moroto', 'state' => 'Karamoja', 'country' => 'Uganda']],
            ['name' => 'Kasule Hassan', 'email' => 'hassan.kasule@gmail.com', 'phone' => '+256779012000', 'company' => 'Iganga Motors', 'source' => 'cold_call', 'address' => ['street' => '3 Highway Rd', 'city' => 'Iganga', 'state' => 'Eastern', 'country' => 'Uganda']],
            ['name' => 'Nambooze Janet', 'email' => 'janet.nambooze@gmail.com', 'phone' => '+256750123000', 'company' => null, 'source' => 'social_media', 'address' => ['street' => 'Naalya Estate', 'city' => 'Kampala', 'state' => 'Central', 'country' => 'Uganda']],
            ['name' => 'Mugabi Kenneth', 'email' => 'kenneth.mugabi@gmail.com', 'phone' => '+256701555000', 'company' => 'Bushenyi Coffee Exports', 'source' => 'trade_show', 'address' => ['street' => 'Export Zone', 'city' => 'Bushenyi', 'state' => 'Western', 'country' => 'Uganda']],
            ['name' => 'Tusiime Beatrice', 'email' => 'beatrice.t@outlook.com', 'phone' => '+256772666000', 'company' => null, 'source' => 'referral', 'address' => ['street' => 'Rwenzori Ave', 'city' => 'Kasese', 'state' => 'Western', 'country' => 'Uganda']],
            ['name' => 'Lule Andrew', 'email' => 'andrew.lule@gmail.com', 'phone' => '+256753777000', 'company' => 'Wakiso Fresh Market', 'source' => 'website', 'address' => ['street' => 'Wakiso Town', 'city' => 'Wakiso', 'state' => 'Central', 'country' => 'Uganda']],
            ['name' => 'Akello Christine', 'email' => 'christine.akello@gmail.com', 'phone' => '+256784888000', 'company' => null, 'source' => 'cold_call', 'address' => ['street' => 'Adjumani Rd', 'city' => 'Adjumani', 'state' => 'West Nile', 'country' => 'Uganda']],
            ['name' => 'Musoke Richard', 'email' => 'richard.musoke@gmail.com', 'phone' => '+256705999000', 'company' => 'Nansana Electronics', 'source' => 'social_media', 'address' => ['street' => 'Nansana Center', 'city' => 'Nansana', 'state' => 'Central', 'country' => 'Uganda']],
            ['name' => 'Owori Robert', 'email' => 'robert.owori@yahoo.com', 'phone' => '+256776111000', 'company' => 'Busia Cross-Border Ltd', 'source' => 'referral', 'address' => ['street' => 'Custom Post', 'city' => 'Busia', 'state' => 'Eastern', 'country' => 'Uganda']],
            ['name' => 'Nakabugo Suzan', 'email' => 'suzan.n@gmail.com', 'phone' => '+256757222000', 'company' => null, 'source' => 'website', 'address' => ['street' => 'Kira Rd', 'city' => 'Kira', 'state' => 'Central', 'country' => 'Uganda']],
            ['name' => 'Ddamulira Ivan', 'email' => 'ivan.d@gmail.com', 'phone' => '+256708333000', 'company' => 'Entebbe Airport Shops', 'source' => 'trade_show', 'address' => ['street' => 'Airport Rd', 'city' => 'Entebbe', 'state' => 'Central', 'country' => 'Uganda']],
            ['name' => 'Nekesa Florence', 'email' => 'florence.nekesa@gmail.com', 'phone' => '+256779444000', 'company' => null, 'source' => 'social_media', 'address' => ['street' => 'Malaba Road', 'city' => 'Malaba', 'state' => 'Eastern', 'country' => 'Uganda']],
            ['name' => 'Kakooza George', 'email' => 'george.kakooza@outlook.com', 'phone' => '+256750555000', 'company' => 'Kampala Auto Parts', 'source' => 'cold_call', 'address' => ['street' => 'Industrial Area, Plot 8', 'city' => 'Kampala', 'state' => 'Central', 'country' => 'Uganda']],
            ['name' => 'Nambi Harriet', 'email' => 'harriet.nambi@gmail.com', 'phone' => '+256701666000', 'company' => null, 'source' => 'referral', 'address' => ['street' => 'Mengo Hill', 'city' => 'Kampala', 'state' => 'Central', 'country' => 'Uganda']],
            ['name' => 'Opwonya James', 'email' => 'james.opwonya@gmail.com', 'phone' => '+256772777000', 'company' => 'Nebbi Market', 'source' => 'website', 'address' => ['street' => 'Lake Albert Rd', 'city' => 'Nebbi', 'state' => 'West Nile', 'country' => 'Uganda']],
            ['name' => 'Kagoya Linda', 'email' => 'linda.kagoya@yahoo.com', 'phone' => '+256753888000', 'company' => 'Kashari Beauty Salon', 'source' => 'social_media', 'address' => ['street' => 'Bushenyi Rd', 'city' => 'Mbarara', 'state' => 'Western', 'country' => 'Uganda']],
            ['name' => 'Ssentongo Michael', 'email' => 'michael.ssentongo@gmail.com', 'phone' => '+256784999000', 'company' => 'Mpigi General Store', 'source' => 'cold_call', 'address' => ['street' => 'Mpigi Trading Center', 'city' => 'Mpigi', 'state' => 'Central', 'country' => 'Uganda']],
            ['name' => 'Asio Eunice', 'email' => 'eunice.asio@gmail.com', 'phone' => '+256705100000', 'company' => null, 'source' => 'trade_show', 'address' => ['street' => 'Katakwi Rd', 'city' => 'Katakwi', 'state' => 'Eastern', 'country' => 'Uganda']],
            ['name' => 'Bbosa William', 'email' => 'william.bbosa@outlook.com', 'phone' => '+256776200000', 'company' => 'Jinja Steel Works', 'source' => 'referral', 'address' => ['street' => 'Nile Crescent', 'city' => 'Jinja', 'state' => 'Eastern', 'country' => 'Uganda']],
            ['name' => 'Nimusiima Patience', 'email' => 'patience.n@gmail.com', 'phone' => '+256757300000', 'company' => null, 'source' => 'website', 'address' => ['street' => 'Ntungamo Hill', 'city' => 'Ntungamo', 'state' => 'Western', 'country' => 'Uganda']],
            ['name' => 'Olweny Patrick', 'email' => 'patrick.olweny@gmail.com', 'phone' => '+256708400000', 'company' => 'Apac Farmers Coop', 'source' => 'cold_call', 'address' => ['street' => 'Cooperative Rd', 'city' => 'Apac', 'state' => 'Northern', 'country' => 'Uganda']],
            ['name' => 'Nabirye Scovia', 'email' => 'scovia.nabirye@gmail.com', 'phone' => '+256779500000', 'company' => null, 'source' => 'social_media', 'address' => ['street' => 'Bugembe Rd', 'city' => 'Jinja', 'state' => 'Eastern', 'country' => 'Uganda']],
            ['name' => 'Kategaya Simon', 'email' => 'simon.kategaya@outlook.com', 'phone' => '+256750600000', 'company' => 'Masindi Oil Store', 'source' => 'referral', 'address' => ['street' => 'Station Road', 'city' => 'Masindi', 'state' => 'Western', 'country' => 'Uganda']],
        ];

        $result = [];
        foreach ($customers as $c) {
            $c['tags'] = $this->randomTags();
            $c['custom_fields'] = [];
            $c['lifetime_value'] = 0;
            $c['is_active'] = true;
            $result[] = Customer::firstOrCreate(['email' => $c['email']], $c);
        }

        return $result;
    }

    private function randomTags(): array
    {
        $all = ['VIP', 'Wholesale', 'Retail', 'Recurring', 'New', 'Premium', 'Corporate', 'Walk-in', 'Online'];
        shuffle($all);
        return array_slice($all, 0, rand(1, 3));
    }

    private function seedOrders(array $customers, array $products): array
    {
        $users = User::all();
        $statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
        $orders = [];

        for ($i = 0; $i < 120; $i++) {
            $customer = $customers[array_rand($customers)];
            $user = $users->random();
            $status = $statuses[array_rand($statuses)];
            $numItems = rand(1, 5);
            $subtotal = 0;
            $createdAt = now()->subDays(rand(0, 120))->subHours(rand(0, 23));
            $orderNumber = sprintf('ORD-%s-%04d', $createdAt->format('Ymd'), $i + 1);

            $order = Order::create([
                'customer_id' => $customer->id,
                'user_id' => $user->id,
                'order_number' => $orderNumber,
                'status' => $status,
                'subtotal' => 0,
                'tax' => 0,
                'discount' => 0,
                'total' => 0,
                'shipping_address' => $customer->address,
                'notes' => rand(0, 3) === 0 ? 'Please deliver before 5pm' : null,
                'metadata' => [],
                'created_at' => $createdAt,
            ]);

            $selectedProducts = collect($products)->random($numItems);
            foreach ($selectedProducts as $product) {
                $qty = rand(1, 4);
                $unitPrice = $product->price;
                $total = $qty * $unitPrice;
                $subtotal += $total;

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => $qty,
                    'unit_price' => $unitPrice,
                    'total' => $total,
                    'metadata' => [],
                ]);
            }

            $tax = round($subtotal * 0.18); // 18% VAT Uganda
            $discount = rand(0, 4) === 0 ? round($subtotal * 0.05) : 0;
            $order->update([
                'subtotal' => $subtotal,
                'tax' => $tax,
                'discount' => $discount,
                'total' => $subtotal + $tax - $discount,
            ]);

            // Update customer lifetime value for delivered orders
            if ($status === 'delivered') {
                $customer->increment('lifetime_value', $subtotal + $tax - $discount);
            }

            $orders[] = $order;
        }

        return $orders;
    }

    private function seedLeads(array $customers): array
    {
        $stages = PipelineStage::all();
        $users = User::all();
        $sources = ['website', 'referral', 'social_media', 'cold_call', 'trade_show', 'email_campaign'];
        $titles = [
            'New Website Inquiry',
            'Product Demo Request',
            'Bulk Order Discussion',
            'Partnership Opportunity',
            'Wholesale Pricing',
            'Corporate Account Setup',
            'Service Upgrade',
            'Custom Order Request',
            'Repeat Purchase Interest',
            'Event Sponsorship Deal',
            'Trade-in Offer',
            'Volume Discount Negotiation',
            'Referral Follow-up',
            'Seasonal Campaign Lead',
            'Market Expansion Inquiry',
            'Product Launch Interest',
            'Support Upsell',
            'Training Package Proposal',
            'Loyalty Program Enrollment',
            'Cross-sell Opportunity',
            'Government Tender Lead',
            'NGO Equipment Supply',
            'School Supply Contract',
            'Hospital Procurement',
            'Hotel Supply Partnership',
        ];

        $leads = [];
        foreach ($titles as $i => $title) {
            $stage = $stages->random();
            $customer = $customers[array_rand($customers)];
            $user = $users->random();

            $lead = Lead::create([
                'customer_id' => $customer->id,
                'stage_id' => $stage->id,
                'assigned_to' => $user->id,
                'title' => $title,
                'value' => rand(1, 50) * 100000,
                'probability' => $stage->is_won ? 100 : ($stage->is_lost ? 0 : rand(10, 90)),
                'expected_close' => now()->addDays(rand(5, 90))->format('Y-m-d'),
                'source' => $sources[array_rand($sources)],
                'tags' => $this->randomTags(),
                'custom_fields' => [],
                'won_at' => $stage->is_won ? now()->subDays(rand(1, 30)) : null,
                'lost_at' => $stage->is_lost ? now()->subDays(rand(1, 30)) : null,
                'lost_reason' => $stage->is_lost ? collect(['Price too high', 'Went with competitor', 'Budget cut', 'Not ready yet'])->random() : null,
                'created_at' => now()->subDays(rand(5, 120)),
            ]);

            $leads[] = $lead;
        }

        return $leads;
    }

    private function seedInteractions(array $customers, array $leads): void
    {
        $users = User::all();
        $types = ['email', 'call', 'meeting', 'note', 'task'];
        $channels = ['phone', 'email', 'in-person', 'chat', 'video'];
        $subjects = [
            'Initial outreach',
            'Follow-up call',
            'Product demo scheduled',
            'Pricing discussion',
            'Contract review',
            'Support call',
            'Onboarding meeting',
            'Quarterly review',
            'Feedback collection',
            'Complaint resolution',
            'Upsell proposal',
            'Renewal reminder',
            'Invoice follow-up',
            'Delivery confirmation',
            'Thank you note',
        ];

        for ($i = 0; $i < 80; $i++) {
            $customer = $customers[array_rand($customers)];
            $user = $users->random();
            $type = $types[array_rand($types)];
            $isCompleted = rand(0, 3) > 0;
            $lead = rand(0, 2) === 0 && !empty($leads) ? $leads[array_rand($leads)] : null;

            Interaction::create([
                'customer_id' => $customer->id,
                'user_id' => $user->id,
                'lead_id' => $lead?->id,
                'type' => $type,
                'channel' => $channels[array_rand($channels)],
                'subject' => $subjects[array_rand($subjects)],
                'body' => 'Discussed ' . collect(['product details', 'pricing', 'delivery timelines', 'order status', 'partnership terms', 'support issues'])->random() . ' with the customer.',
                'scheduled_at' => rand(0, 1) ? now()->subDays(rand(0, 60))->format('Y-m-d H:i:s') : null,
                'completed_at' => $isCompleted ? now()->subDays(rand(0, 30))->format('Y-m-d H:i:s') : null,
                'metadata' => [
                    'duration_minutes' => $type === 'call' ? rand(5, 45) : ($type === 'meeting' ? rand(30, 120) : null),
                ],
                'created_at' => now()->subDays(rand(0, 90)),
            ]);
        }
    }

    private function seedEmailTemplates(): void
    {
        $templates = [
            [
                'name' => 'Order Confirmation',
                'subject' => 'Order {{order_number}} Confirmed',
                'body' => "Dear {{customer_name}},\n\nThank you for your order #{{order_number}}.\n\nOrder Total: UGX {{order_total}}\n\nWe will process your order shortly and notify you when it ships.\n\nThank you for choosing Lead Pulse!\n\nBest regards,\nThe Lead Pulse Team",
                'variables' => ['customer_name', 'order_number', 'order_total'],
                'is_active' => true,
            ],
            [
                'name' => 'Shipping Notification',
                'subject' => 'Your Order {{order_number}} Has Shipped!',
                'body' => "Dear {{customer_name}},\n\nGreat news! Your order #{{order_number}} has been shipped.\n\nEstimated delivery: {{delivery_date}}\n\nThank you for your patience.\n\nBest regards,\nThe Lead Pulse Team",
                'variables' => ['customer_name', 'order_number', 'delivery_date'],
                'is_active' => true,
            ],
            [
                'name' => 'Welcome Email',
                'subject' => 'Welcome to Lead Pulse, {{customer_name}}!',
                'body' => "Dear {{customer_name}},\n\nWelcome to Lead Pulse! We're excited to have you as a valued customer.\n\nFeel free to browse our products and reach out if you need assistance.\n\nBest regards,\nThe Lead Pulse Team",
                'variables' => ['customer_name'],
                'is_active' => true,
            ],
            [
                'name' => 'Payment Reminder',
                'subject' => 'Payment Reminder for Order {{order_number}}',
                'body' => "Dear {{customer_name}},\n\nThis is a friendly reminder that payment for order #{{order_number}} (UGX {{order_total}}) is pending.\n\nPlease complete your payment at your earliest convenience.\n\nBest regards,\nThe Lead Pulse Team",
                'variables' => ['customer_name', 'order_number', 'order_total'],
                'is_active' => true,
            ],
            [
                'name' => 'Lead Follow-Up',
                'subject' => 'Following Up on Your Inquiry',
                'body' => "Dear {{customer_name}},\n\nThank you for your interest in {{lead_title}}.\n\nI wanted to follow up and see if you have any questions or if there's anything else I can help with.\n\nLooking forward to hearing from you.\n\nBest regards,\n{{assignee_name}}",
                'variables' => ['customer_name', 'lead_title', 'assignee_name'],
                'is_active' => true,
            ],
            [
                'name' => 'Feedback Request',
                'subject' => 'How Was Your Experience?',
                'body' => "Dear {{customer_name}},\n\nWe hope you're enjoying your recent purchase (Order #{{order_number}}).\n\nWe'd love to hear your feedback! Your input helps us improve.\n\nThank you!\n\nBest regards,\nThe Lead Pulse Team",
                'variables' => ['customer_name', 'order_number'],
                'is_active' => true,
            ],
        ];

        foreach ($templates as $template) {
            EmailTemplate::firstOrCreate(['name' => $template['name']], $template);
        }
    }

    private function seedActivityLogs(): void
    {
        $users = User::all();
        $actions = [
            ['action' => 'created', 'model_type' => 'Order', 'description' => 'Created a new order'],
            ['action' => 'updated', 'model_type' => 'Customer', 'description' => 'Updated customer information'],
            ['action' => 'created', 'model_type' => 'Lead', 'description' => 'Created a new lead'],
            ['action' => 'status_changed', 'model_type' => 'Order', 'description' => 'Changed order status to delivered'],
            ['action' => 'moved', 'model_type' => 'Lead', 'description' => 'Moved lead to Qualified stage'],
            ['action' => 'created', 'model_type' => 'Interaction', 'description' => 'Logged a phone call'],
            ['action' => 'deleted', 'model_type' => 'Product', 'description' => 'Archived a product'],
            ['action' => 'updated', 'model_type' => 'Setting', 'description' => 'Updated system settings'],
            ['action' => 'login', 'model_type' => 'User', 'description' => 'User logged in'],
            ['action' => 'created', 'model_type' => 'Customer', 'description' => 'Added a new customer'],
        ];

        for ($i = 0; $i < 40; $i++) {
            $user = $users->random();
            $act = $actions[array_rand($actions)];

            ActivityLog::create([
                'user_id' => $user->id,
                'action' => $act['action'],
                'model_type' => $act['model_type'],
                'model_id' => rand(1, 50),
                'changes' => null,
                'ip_address' => '192.168.' . rand(0, 255) . '.' . rand(1, 254),
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'created_at' => now()->subDays(rand(0, 60))->subHours(rand(0, 23)),
            ]);
        }
    }
}
