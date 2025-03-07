import Image from "next/image"
import { Card } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Heart, ShoppingCart } from "lucide-react"

interface ArtifactCardProps {
  name: string
  type: string
  rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary"
  price: string
  image: string
}

export default function ArtifactCard({ name, type, rarity, price, image }: ArtifactCardProps) {
  // Determine badge color based on rarity
  const getBadgeColor = () => {
    switch (rarity) {
      case "Common":
        return "bg-gray-500"
      case "Uncommon":
        return "bg-green-500"
      case "Rare":
        return "bg-blue-500"
      case "Epic":
        return "bg-purple-500"
      case "Legendary":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card className="bg-black/40 border-purple-900/30 overflow-hidden group">
      <div className="relative">
        <Image
          src={image || "/placeholder.svg"}
          alt={name}
          width={300}
          height={300}
          className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <Badge className={`absolute top-2 right-2 ${getBadgeColor()}`}>{rarity}</Badge>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 left-2 text-gray-400 hover:text-red-400 hover:bg-black/40"
        >
          <Heart className="h-5 w-5" />
        </Button>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-lg">{name}</h3>
            <p className="text-gray-400 text-sm">{type}</p>
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <div>
            <p className="text-xs text-gray-400">Price</p>
            <p className="font-bold text-lg">{price}</p>
          </div>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Buy Now
          </Button>
        </div>
      </div>
    </Card>
  )
}

