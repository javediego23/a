export default function Header() {
    return (
        <header className="fixed top-0 left-64 right-0 h-20 glass-panel z-40 px-8 flex items-center justify-between border-b border-gray-100/50">
            <div>
                <h1 className="text-xl font-bold text-gray-800">Panel de Control</h1>
                <p className="text-sm text-gray-500">Bienvenido de nuevo, Agricultor</p>
            </div>

            <div className="flex items-center gap-4">
                <button className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm hover:shadow-md transition-all text-gray-600">
                    <span className="sr-only">Notificaciones</span>
                    🔔
                </button>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                    JS
                </div>
            </div>
        </header>
    );
}
