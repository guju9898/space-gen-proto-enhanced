import { 
  Home, 
  Bed, 
  Utensils, 
  Bath, 
  Briefcase, 
  UtensilsCrossed,
  Layout,
  Minimize,
  Snowflake,
  Factory,
  Flower,
  Palette,
  Sun,
  Lightbulb,
  Theater,
  Lamp,
  Sunrise,
  Sunset,
  Moon,
  Feather,
  Zap,
  Crown,
  Smile,
  Building,
  Camera,
  Square,
  Circle,
  LucideIcon
} from "lucide-react"

interface Option {
  label: string
  value: string
  icon?: LucideIcon
}

export const roomTypes: Option[] = [
  { label: "Living Room", value: "living", icon: Home },
  { label: "Bedroom", value: "bedroom", icon: Bed },
  { label: "Kitchen", value: "kitchen", icon: Utensils },
  { label: "Bathroom", value: "bathroom", icon: Bath },
  { label: "Office", value: "office", icon: Briefcase },
  { label: "Dining Room", value: "dining", icon: UtensilsCrossed },
]

export const designStyles: Option[] = [
  { label: "Modern", value: "modern", icon: Layout },
  { label: "Minimalist", value: "minimalist", icon: Minimize },
  { label: "Scandinavian", value: "scandinavian", icon: Snowflake },
  { label: "Industrial", value: "industrial", icon: Factory },
  { label: "Bohemian", value: "bohemian", icon: Flower },
  { label: "Traditional", value: "traditional", icon: Home },
]

export const colorPalettes: Option[] = [
  { label: "Neutral", value: "neutral", icon: Palette },
  { label: "Warm", value: "warm", icon: Sun },
  { label: "Cool", value: "cool", icon: Snowflake },
  { label: "Earthy", value: "earthy", icon: Flower },
  { label: "Pastel", value: "pastel", icon: Palette },
  { label: "Bold", value: "bold", icon: Palette },
]

export const lightingOptions: Option[] = [
  { label: "Natural", value: "natural", icon: Sun },
  { label: "Warm", value: "warm", icon: Lightbulb },
  { label: "Cool", value: "cool", icon: Lightbulb },
  { label: "Dramatic", value: "dramatic", icon: Theater },
  { label: "Ambient", value: "ambient", icon: Lamp },
]

export const timeOfDayOptions: Option[] = [
  { label: "Morning", value: "morning", icon: Sunrise },
  { label: "Afternoon", value: "afternoon", icon: Sun },
  { label: "Evening", value: "evening", icon: Sunset },
  { label: "Night", value: "night", icon: Moon },
]

export const moodOptions: Option[] = [
  { label: "Calm", value: "calm", icon: Feather },
  { label: "Energetic", value: "energetic", icon: Zap },
  { label: "Cozy", value: "cozy", icon: Home },
  { label: "Luxurious", value: "luxurious", icon: Crown },
  { label: "Playful", value: "playful", icon: Smile },
]

export const architects: Option[] = [
  { label: "Foster", value: "foster", icon: Building },
  { label: "Hadid", value: "hadid", icon: Building },
  { label: "Gehry", value: "gehry", icon: Building },
  { label: "Nouvel", value: "nouvel", icon: Building },
  { label: "Koolhaas", value: "koolhaas", icon: Building },
]

export const lenses: Option[] = [
  { label: "Wide", value: "wide", icon: Camera },
  { label: "Standard", value: "standard", icon: Camera },
  { label: "Telephoto", value: "telephoto", icon: Camera },
  { label: "Fisheye", value: "fisheye", icon: Camera },
]

export const typologies: Option[] = [
  { label: "Open", value: "open", icon: Layout },
  { label: "Closed", value: "closed", icon: Layout },
  { label: "Semi-Open", value: "semi-open", icon: Layout },
  { label: "Split", value: "split", icon: Layout },
]

export const geometries: Option[] = [
  { label: "Rectangular", value: "rectangular", icon: Square },
  { label: "Square", value: "square", icon: Square },
  { label: "Circular", value: "circular", icon: Circle },
  { label: "L-Shaped", value: "l-shaped", icon: Square },
  { label: "U-Shaped", value: "u-shaped", icon: Square },
] 