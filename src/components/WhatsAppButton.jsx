import { useState, useRef, useEffect } from 'react'

export default function WhatsAppButton() {
    // استخدمنا Y فقط لأن الحركة أصبحت فوق وتحت فقط
    const [positionY, setPositionY] = useState(0)
    const [isDragging, setIsDragging] = useState(false)

    const dragRef = useRef(false)
    const startY = useRef(0)

    const handleStart = (e) => {
        if (e.type === 'mousedown') {
            e.preventDefault()
        }

        const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY

        setIsDragging(true)
        dragRef.current = false

        startY.current = clientY - positionY
    }

    useEffect(() => {
        const handleMove = (e) => {
            if (!isDragging) return

            const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY
            dragRef.current = true

            let newY = clientY - startY.current

            // === حدود الحماية الذكية ===
            // maxUp: أقصى ارتفاع لفوق (نص الشاشة)
            const maxUp = - (window.innerHeight / 2)
            // maxDown: أقصى نزول لتحت (صفر يعني مكانها الأصلي عشان متخرجش برا الشاشة)
            const maxDown = 0

            // تطبيق الحماية لمنع الأيقونة من تخطي الحدود
            if (newY < maxUp) newY = maxUp
            if (newY > maxDown) newY = maxDown

            setPositionY(newY)
        }

        const handleEnd = () => {
            setIsDragging(false)
        }

        if (isDragging) {
            window.addEventListener('mousemove', handleMove)
            window.addEventListener('mouseup', handleEnd)
            window.addEventListener('touchmove', handleMove, { passive: false })
            window.addEventListener('touchend', handleEnd)
        }

        return () => {
            window.removeEventListener('mousemove', handleMove)
            window.removeEventListener('mouseup', handleEnd)
            window.removeEventListener('touchmove', handleMove)
            window.removeEventListener('touchend', handleEnd)
        }
    }, [isDragging])

    const handleClick = (e) => {
        if (dragRef.current) {
            e.preventDefault()
        }
    }

    return (
        <a
            href="https://wa.me/201222882068"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="تواصل معنا عبر واتساب"
            onClick={handleClick}
            onMouseDown={handleStart}
            onTouchStart={handleStart}
            draggable={false}
            style={{
                transform: `translateY(${positionY}px)`, // الحركة فوق وتحت فقط
                touchAction: 'none' // لمنع السكرول في الموبايل أثناء السحب
            }}
            className={`fixed left-[20px] bottom-[80px] md:bottom-[25px] w-[50px] h-[50px] bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_4px_12px_#0002] z-[9999] no-underline select-none ${isDragging
                    ? 'cursor-grabbing'
                    : 'cursor-grab hover:scale-110 transition-transform duration-300'
                }`}
        >
            <svg
                width="28"
                height="28"
                viewBox="0 0 32 32"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
                draggable={false}
            >
                <path d="M16 .5A15.5 15.5 0 0 0 2.7 24L.5 31.5l7.8-2.1A15.5 15.5 0 1 0 16 .5zm0 28a12.5 12.5 0 0 1-6.4-1.8l-.5-.3-4.6 1.2 1.2-4.6-.3-.5A12.5 12.5 0 1 1 16 28.5zm6.9-9.4c-.4-.2-2.2-1.1-2.6-1.2-.3-.1-.6-.2-.8.2-.3.4-1 1.2-1.2 1.4-.2.3-.4.3-.8.1-.4-.2-1.6-.6-3-1.9-1.1-1-1.9-2.2-2.1-2.6-.2-.4 0-.6.2-.8l.6-.7c.2-.2.3-.4.4-.6.1-.3 0-.5 0-.7l-1.2-2.8c-.3-.7-.6-.6-.8-.6h-.7c-.3 0-.7.1-1 .5-.4.4-1.4 1.3-1.4 3.1s1.4 3.5 1.6 3.8c.2.3 2.7 4.1 6.5 5.7.9.4 1.6.6 2.2.7.9.3 1.7.2 2.3.1.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.7.2-1.8-.1-.2-.4-.3-.8-.5z" />
            </svg>
        </a>
    )
}