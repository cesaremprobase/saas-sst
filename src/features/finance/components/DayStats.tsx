export function DayStats({
    delivered,
    paid
}: {
    delivered: number;
    paid: number;
}) {
    return (
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Entregado Hoy</p>
                <p className="text-2xl font-black text-blue-900">S/ {delivered.toFixed(2)}</p>
            </div>

            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <p className="text-xs text-green-600 font-bold uppercase tracking-wider">Cobrado Hoy</p>
                <p className="text-2xl font-black text-green-900">S/ {paid.toFixed(2)}</p>
            </div>
        </div>
    );
}
