export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-[#e6ece7] mt-8 md:mt-16 py-6 font-sans bg-white mb-[60px] md:mb-0">
            <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row justify-between items-center gap-3 md:gap-6 text-[#718078]">
                <div className="flex flex-col items-center md:items-start text-center md:text-right">
                    <div className="font-black text-[#123e30] text-base md:text-lg mb-0.5 flex items-center gap-1.5">
                        <span>👑</span> Kings Store
                    </div>
                    <div className="text-xs font-medium">متجرك الموثوق للخدمات الرقمية</div>
                </div>
                <div className="text-xs font-bold text-center">
                    © {currentYear} Kings Store. جميع الحقوق محفوظة.
                </div>
            </div>
        </footer>
    )
}