import { Card } from "../../components/ui/card"
import { Users, ShoppingBag, TrendingUp } from "lucide-react"

export default function MarketplaceStats() {
  return (
    <section className="py-12 bg-black/40">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-purple-900/20 to-black border-purple-900/30 p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-600/20 p-3 rounded-lg">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400">Active Players</p>
                <h3 className="text-3xl font-bold">10,278</h3>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/20 to-black border-purple-900/30 p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-600/20 p-3 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400">Total Artifacts</p>
                <h3 className="text-3xl font-bold">57,542</h3>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/20 to-black border-purple-900/30 p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-600/20 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400">Trading Volume</p>
                <h3 className="text-3xl font-bold">5,557 ETH</h3>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}

