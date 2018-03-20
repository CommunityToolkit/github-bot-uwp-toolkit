// Array utils

export const distinct = <T>(array: T[]): T[] => {
    return array.filter((x, i, a) => {
        return a.indexOf(x) === i;
    });
}

// Date utils

export const addDays = (date: Date, days: number): Date => {
    const newDate = new Date();
    newDate.setDate(date.getDate() + days);
    return newDate;
}