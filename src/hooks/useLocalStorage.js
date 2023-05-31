import { useState, useEffect } from "react";

export default function useLocalStorage(eventName, localKey) {
    const initialValue = localStorage.getItem(localKey) ? JSON.parse(localStorage.getItem(localKey)) : [''];
    const [storage, setStorage] = useState(initialValue);

    useEffect(() => {
        window.addEventListener(eventName, e => setStorage(e.newValue));

        return () => window.removeEventListener(eventName, e => setStorage(e.newValue));
    // eslint-disable-next-line
    }, [storage]);

    const updateLocalStorage = (newValue) => {
        localStorage.setItem(localKey, JSON.stringify(newValue));

        let event = new Event(eventName);
        event.newValue = newValue;
        window.dispatchEvent(event);
    }
    return [storage, updateLocalStorage];
}