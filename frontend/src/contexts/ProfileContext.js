import React, { createContext, useState } from "react";

export const ProfileContext = createContext();

export function ProfileProvider({ children }) {
  const [profiles, setProfiles] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);

  return (
    <ProfileContext.Provider value={{ profiles, setProfiles, currentProfile, setCurrentProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}