import useMessages from 'context/hooks/useMessages';
import latestMessageByType from 'helpers/messages';
import { useEffect, useState } from 'react';
import useLocalStorage from './useLocalStorage';
import { useParams } from 'react-router-dom';

export default function useSettingsToFormData() {
  const { id: room } = useParams();
  const [formData, setFormData] = useState({});
  const { messages } = useMessages();
  const settings = useLocalStorage('gameSettings')[0];

  // once our data from localstorage updates, push them to the formData.
  useEffect(() => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      ...settings,
      room,
    }));
  }, []);

  // Import our private room settings into the form data.
  useEffect(() => {
    if (room.toUpperCase() === 'PUBLIC') return;

    const message = latestMessageByType(messages, 'room');

    if (message?.settings) {
      setFormData((previousFormData) => ({
        ...previousFormData,
        ...JSON.parse(message.settings),
      }));
    }
  }, [messages]);

  return [formData, setFormData];
}
