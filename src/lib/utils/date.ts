export const getPeruDate = (): string => {
    // Returns YYYY-MM-DD in 'America/Lima'
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
};

export const getPeruTime = (): string => {
    // Returns HH:mm in 'America/Lima'
    return new Date().toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Lima'
    });
};

export const formatPeruDate = (dateStr: string): string => {
    // Formats YYYY-MM-DD to DD/MM/YYYY
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}
