import { useNavigate } from 'react-router-dom'

export default function ProductCard({ product }) {
    const navigate = useNavigate();

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-primary/20 hover:shadow-lg transition-all duration-300 flex flex-col h-full">
            <div className="flex-grow">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-bold text-secondary bg-gray-50 px-3 py-1 rounded-md border border-gray-100">
                        {product.category}
                    </span>
                    <span className="text-lg font-black text-primary">${product.price}</span>
                </div>

                <h3 className="text-lg font-black text-primary mb-3">{product.title}</h3>

                <ul className="text-xs text-secondary space-y-2 mb-6">
                    {product.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-primary rounded-full opacity-50"></span>
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>

            <button
                onClick={() => navigate(`/checkout/${product.id}`)}
                className="w-full bg-primary text-white text-sm font-bold py-3.5 rounded-xl hover:bg-black transition-colors shadow-md shadow-primary/10"
            >
                شراء
            </button>
        </div>
    )
}