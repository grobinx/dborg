import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import { DateTime } from "luxon";
import { useDatabase } from "@renderer/contexts/DatabaseContext";
import { useToast } from "@renderer/contexts/ToastContext";
import { useDialogs } from "@toolpad/core";
import { uuidv7 } from "uuidv7";
import { DBORG_DATA_PATH_NAME } from "../../../api/dborg-path";
import * as api from "../../../api/db";
import { useTranslation } from "react-i18next";
import PasswordDialog from "@renderer/dialogs/PasswordDialog";
import { Properties } from "src/api/db";
import useListeners from "@renderer/hooks/useListeners";
import { ProfileRecord, ProfileUsePasswordType } from "../../../api/entities";
import { useMessages } from "./MessageContext";

export const PROFILE_UPDATE_MESSAGE = "profile-update";
export interface ProfileUpdateMessage {
    profileId: string;
    profile: Partial<ProfileRecord>;
}

export type ProfileEventType =
    | 'creating'
    | 'updating'
    | 'deleting'
    | 'connecting'
    | 'disconnecting'
    | 'testing'
    | 'fetching'
    | 'storing'
    ;

type ProfileEventConnecting = { profile: ProfileRecord; status: 'started' | 'cancel' | 'success' | 'error'; connection?: api.ConnectionInfo; error?: any };
type ProfileEventDisconnecting = { profile: ProfileRecord; connectionUniqueId: string; status: 'started' | 'cancel' | 'success' | 'error'; error?: any };
type ProfileEventTesting = { profile: ProfileRecord; status: 'started' | 'cancel' | 'success' | 'error'; error?: any };
type ProfileEventFetching = { status: 'started' | 'success' | 'error'; error?: any };
type ProfileEventStoring = { status: 'started' | 'success' | 'error'; error?: any };
type ProfileEventCreating = { profile: ProfileRecord; status: 'started' | 'cancel' | 'success' | 'error'; error?: any };
type ProfileEventUpdating = { profile: ProfileRecord; status: 'started' | 'cancel' | 'success' | 'error'; error?: any };
type ProfileEventDeleting = { profile: ProfileRecord; status: 'started' | 'cancel' | 'success' | 'error'; error?: any };

type ProfileEvent =
    | ProfileEventConnecting
    | ProfileEventDisconnecting
    | ProfileEventTesting
    | ProfileEventFetching
    | ProfileEventStoring
    | ProfileEventCreating
    | ProfileEventUpdating
    | ProfileEventDeleting
    ;

type ProfileEventMethod = {
    (type: 'connecting', callback: (event: ProfileEventConnecting) => void): () => void;
    (type: 'disconnecting', callback: (event: ProfileEventDisconnecting) => void): () => void;
    (type: 'testing', callback: (event: ProfileEventTesting) => void): () => void;
    (type: 'fetching', callback: (event: ProfileEventFetching) => void): () => void;
    (type: 'storing', callback: (event: ProfileEventStoring) => void): () => void;
    (type: 'creating', callback: (event: ProfileEventCreating) => void): () => void;
    (type: 'updating', callback: (event: ProfileEventUpdating) => void): () => void;
    (type: 'deleting', callback: (event: ProfileEventDeleting) => void): () => void;
};

interface ProfilesContextValue {
    initialized: boolean;
    profiles: ProfileRecord[];
    getProfile: (profileId: string, throwError?: boolean) => ProfileRecord | null;
    reloadProfiles: () => Promise<void>;
    createProfile: (profile: Omit<ProfileRecord, 'sch_id' | 'sch_created' | 'sch_updated' | 'sch_order'>) => Promise<string | undefined>;
    updateProfile: (profileId: string, profile: Partial<ProfileRecord>) => boolean | undefined;
    deleteProfile: (profileId: string) => Promise<boolean>;
    swapProfilesOrder: (sourceProfileId: string, targetProfileId: string, group?: boolean) => Promise<void>;
    connectToDatabase: (profileId: string) => Promise<api.ConnectionInfo | undefined>;
    disconnectSession: (uniqueId: string) => Promise<void>;
    disconnectProfile: (profileId: string) => Promise<void>;
    testConnection: (driverUniqueId: string, usePassword: ProfileUsePasswordType, properties: Properties, profileName: string) => Promise<boolean | undefined>;

    onEvent: ProfileEventMethod;
}

const ProfilesContext = createContext<ProfilesContextValue | undefined>(undefined);

export const ProfilesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { drivers, connections } = useDatabase();
    const addToast = useToast();
    const dialogs = useDialogs();
    const { t } = useTranslation();
    const { onEvent, emitEvent } = useListeners<ProfileEvent>();
    const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
    const [profilesInitialized, setProfilesInitialized] = useState<boolean>(false);
    const profilesRef = React.useRef<ProfileRecord[]>(profiles);
    const [justFetched, setJustFetched] = useState<boolean>(false);
    const [oryginalProfilesData, setOryginalProfilesData] = useState<string | null>(null);
    const { subscribe } = useMessages();

    const getProfile = useCallback((profileId: string, throwError: boolean = true) => {
        if (profilesRef.current) {
            const profile = profilesRef.current.find((s) => s.sch_id === profileId);
            if (profile) {
                return JSON.parse(JSON.stringify(profile)) as ProfileRecord;
            }
        }
        if (throwError) {
            throw new Error(t("profile-id-not-found", "Profile not found!"));
        }
        return null;
    }, []);

    const loadProfiles = useCallback(async () => {
        emitEvent('fetching', { status: 'started' });
        const dataPath = await window.dborg.path.get(DBORG_DATA_PATH_NAME);

        if (await window.dborg.file.exists(`${dataPath}/schemas.json`)) {
            await window.dborg.file.renameFile(`${dataPath}/schemas.json`, `${dataPath}/profiles.json`);
        }

        const data = await window.dborg.file.readFile(`${dataPath}/profiles.json`).catch(() => null);
        if (data) {
            try {
                const loadedProfiles = JSON.parse(data);
                setProfiles(loadedProfiles);
                setJustFetched(true);
                setOryginalProfilesData(data);
            } catch (error) {
                addToast("error", t("error-parsing-profiles-json", "Error parsing profiles.json file."), { reason: error });
                emitEvent('fetching', { status: 'error', error });
                throw error;
            }
        }
        setProfilesInitialized(true);
        emitEvent('fetching', { status: 'success' });
    }, []);

    const storeProfiles = useCallback(async (profiles: ProfileRecord[]) => {
        emitEvent('storing', { status: 'started' });
        const dataPath = await window.dborg.path.get(DBORG_DATA_PATH_NAME);

        // Backup tylko jeśli profiles się zmieniły
        if (oryginalProfilesData && JSON.stringify(JSON.parse(oryginalProfilesData)) !== JSON.stringify(profiles)) {
            await window.dborg.path.ensureDir(`${dataPath}/backup`);
            const timestamp = DateTime.now().toFormat("yyyyLLdd_HHmmss");
            await window.dborg.file.writeFile(`${dataPath}/backup/profiles.json.${timestamp}`, oryginalProfilesData);
            const backupFiles =
                (await window.dborg.path.list(`${dataPath}/backup`, "profiles.json.*"))
                    .sort((a, b) => b.localeCompare(a));
            if (backupFiles.length > 10) {
                for (let i = 10; i < backupFiles.length; i++) {
                    await window.dborg.file.deleteFile(`${dataPath}/backup/${backupFiles[i]}`);
                }
            }
        }
        await window.dborg.file.writeFile(`${dataPath}/profiles.json`, JSON.stringify(profiles, null, 2));
        emitEvent('storing', { status: 'success' });
    }, [oryginalProfilesData]);

    useEffect(() => {
        profilesRef.current = profiles;
        if (!profilesInitialized) {
            return;
        }
        if (justFetched) {
            setJustFetched(false);
            return;
        }
        storeProfiles(profiles);
    }, [profiles]);

    React.useEffect(() => {
        loadProfiles();
    }, []);
    
    const reloadProfiles = useCallback(async () => {
        await loadProfiles();
    }, []);

    const passwordPrompt = useCallback(async (
        usePassword: ProfileUsePasswordType,
        passwordProperty: string | undefined,
        properties: Properties
    ): Promise<boolean> => {
        if (usePassword === "ask" && passwordProperty) {
            const password = await dialogs.open(PasswordDialog, {});
            if (!password) return false;
            properties[passwordProperty] = password;
        }
        return true;
    }, []);

    const checkExistingConnection = useCallback(async (profileId: string): Promise<boolean> => {
        const existingConnection = (await connections.list()).find(
            (conn) => (conn.userData?.profile as ProfileRecord)?.sch_id === profileId
        );

        if (existingConnection) {
            const confirm = await dialogs.confirm(
                t(
                    "connection-already-established",
                    'A connection to "{{name}}" is already established. Do you want to continue?',
                    { name: (existingConnection.userData.profile as ProfileRecord).sch_name }
                ),
                {
                    severity: "warning",
                    title: t("confirm", "Confirm"),
                    cancelText: t("no", "No"),
                    okText: t("yes", "Yes"),
                }
            );
            return confirm; // Zwraca true, jeśli użytkownik potwierdził, false w przeciwnym razie
        }

        return true; // Brak istniejącego połączenia, można kontynuować
    }, [connections]);

    const connectToDatabase = useCallback(async (profileId: string) => {
        const profile = getProfile(profileId)!;

        emitEvent("connecting", { profile, status: "started" });

        const confirm = await checkExistingConnection(profileId);
        if (!confirm) {
            emitEvent("connecting", { profile, status: "cancel" });
            return;
        }

        const driverId = profile.sch_drv_unique_id as string;
        const properties = profile.sch_properties;
        const usePassword = profile.sch_use_password as ProfileUsePasswordType;
        const passwordProperty = drivers.find(driverId)?.passwordProperty;

        const passwordHandled = await passwordPrompt(usePassword, passwordProperty, properties);
        if (!passwordHandled) {
            emitEvent("connecting", { profile, status: "cancel" });
            return;
        }

        let connection: api.ConnectionInfo;
        try {
            connection = await drivers.connect(driverId, properties);
        }
        catch (error) {
            addToast("error",
                t("profile-connection-error", "Failed to connect to {{name}}!", { name: profile.sch_name }),
                { source: t("profile-context", "Profile context"), reason: error }
            );
            emitEvent("connecting", { profile, status: "error", error });
            throw error;
        }
        profile.sch_last_selected = DateTime.now().toSQL();
        profile.sch_db_version = connection.version;
        profile.sch_updated = DateTime.now().toSQL();
        connections.userData.set(connection.uniqueId, "profile", profile);
        connection.userData.profile = profile;
        setProfiles((prev) => {
            const otherProfiles = prev.filter((s) => s.sch_id !== profileId);
            return [...otherProfiles, profile];
        });
        emitEvent("connecting", { profile, status: "success", connection });
        return connection;
    }, [drivers, connections]);

    const disconnectSession = useCallback(async (uniqueId: string) => {
        const profile = (await connections.userData.get(uniqueId, "profile")) as ProfileRecord;
        emitEvent("disconnecting", { profile: profile, status: "started", connectionUniqueId: uniqueId });
        try {
            await connections.close(uniqueId);
            emitEvent("disconnecting", { profile: profile, status: "success", connectionUniqueId: uniqueId });
        }
        catch (error) {
            emitEvent("disconnecting", { profile: profile, status: "error", connectionUniqueId: uniqueId, error });
            throw error;
        }
    }, [connections]);

    const disconnectProfile = useCallback(async (profileId: string) => {
        const allConnections = (await connections.list()).filter(
            (conn) => (conn.userData?.profile as ProfileRecord)?.sch_id === profileId
        );
        for (const conn of allConnections) {
            disconnectSession(conn.uniqueId);
        }
    }, [connections]);

    const testConnection = useCallback(async (driverUniqueId: string, usePassword: ProfileUsePasswordType, properties: Properties, profileName: string) => {
        const profile = { sch_id: "", sch_drv_unique_id: driverUniqueId, sch_name: profileName, sch_properties: properties };
        try {
            emitEvent("testing", { profile: profile, status: "started" });
            const passwordProperty = drivers.find(driverUniqueId)?.passwordProperty;
            const passwordHandled = await passwordPrompt(usePassword, passwordProperty, properties);
            if (!passwordHandled) {
                emitEvent("testing", { profile: profile, status: "cancel" });
                return;
            }

            const connection = await drivers.connect(driverUniqueId, properties);
            await connections.close(connection.uniqueId);

            addToast("success",
                t("profile-test-success", "Connection \"{{name}}\" is valid.", { name: profileName }),
                { source: t("profile-context", "Profile context") }
            );
            emitEvent("testing", { profile: profile, status: "success" });

            return true;
        }
        catch (error) {
            addToast("error",
                t("profile-test-error", "An error occurred while testing the profile connection \"{{name}}\".", { name: profileName }),
                { source: t("profile-context", "Profile context"), reason: error }
            );
            emitEvent("testing", { profile: profile, status: "error", error });
            throw error;
        }
    }, [drivers, connections]);

    const normalizeOrder = useCallback((profiles: ProfileRecord[]) => {
        return profiles
            .slice()
            .sort((a, b) => (a.sch_order ?? 0) - (b.sch_order ?? 0))
            .map((profile, index) => ({
                ...profile,
                sch_order: index + 1,
                sch_updated: DateTime.now().toSQL(),
            }));
    }, []);

    const deleteProfile = useCallback(async (profileId: string) => {
        const profile = getProfile(profileId)!;
        emitEvent('deleting', { profile, status: 'started' });
        
        if (await dialogs.confirm(
            t("delete-profile-q", 'Delete profile "{{name}}" ?', { name: profile.sch_name }),
            { severity: "warning", title: t("confirm", "Confirm"), cancelText: t("no", "No"), okText: t("yes", "Yes") }
        )) {
            const deletedProfile: ProfileRecord = {
                ...profile,
                sch_deleted: true,
                sch_updated: DateTime.now().toSQL(),
            };
            
            setProfiles(prev =>
                prev.map(p => p.sch_id === profileId ? deletedProfile : p)
            );
            
            emitEvent('deleting', { profile: deletedProfile, status: 'success' });
            return true;
        }
        
        emitEvent('deleting', { profile, status: 'cancel' });
        return false;
    }, []);

    /**
     * Check if a profile with the same name already exists.
     * @param profileName The name of the profile to check.
     * @param profileId The ID of the profile to exclude from the check.
     * @returns True if the profile does not exist or the user confirms to continue.
     */
    const checkProfileExists = useCallback(async (profileName: string, profileId?: string): Promise<boolean> => {
        const profile = profilesRef.current.find(profile => !profile.sch_deleted && profile.sch_name === profileName && profile.sch_id !== profileId);

        if (profile) {
            const confirm = await dialogs.confirm(
                t("profile-exists-q", 'Profile "{{name}}" already exists. Do you want to continue?', { name: profileName }),
                { severity: "warning", title: t("confirm", "Confirm"), cancelText: t("no", "No"), okText: t("yes", "Yes") }
            );
            return confirm;
        }

        return true;
    }, []);

    /**
     * Remove the password property from the profile if the password is not saved.
     * @param profile The profile to check.
     * @param profile.sch_use_password The password usage type.
     * @param profile.sch_properties The profile properties.
     * @param profile.sch_drv_unique_id The driver unique ID.
     * @returns The profile without the password property if the password is not saved.
     */
    const passwordRetention = useCallback((profile: Partial<ProfileRecord>) => {
        if (!profile.sch_properties || !profile.sch_drv_unique_id) {
            return;
        }
        const passwordProperty = drivers.find(profile.sch_drv_unique_id)?.passwordProperty;
        if (profile.sch_use_password !== "save" && passwordProperty) {
            delete profile.sch_properties?.[passwordProperty];
        }
    }, [drivers]);

    /**
     * Create a new profile.
     * @param profile The profile to create.
     * @returns The ID of the created profile.
     */
    const createProfile = useCallback(async (profile: Omit<ProfileRecord, 'sch_id' | 'sch_created' | 'sch_updated' | 'sch_order'>) => {
        emitEvent('creating', { profile: profile as ProfileRecord, status: 'started' });
        if (!(await checkProfileExists(profile.sch_name))) {
            emitEvent('creating', { profile: profile as ProfileRecord, status: 'cancel' });
            return;
        }
        passwordRetention(profile);

        const uniqueId = uuidv7();
        const newProfile = {
            ...profile,
            sch_id: uniqueId,
            sch_created: DateTime.now().toSQL(),
            sch_updated: DateTime.now().toSQL(),
            sch_order: Infinity,
        } as ProfileRecord;
        setProfiles((prev) => normalizeOrder([...prev, newProfile]));
        emitEvent('creating', { profile: newProfile, status: 'success' });
        return uniqueId;
    }, [passwordRetention]);

    /**
     * Update an existing profile.
     * @param profile The profile to update.
     * @returns True if the update was successful, false otherwise.
     */
    const updateProfile = useCallback((profileId: string, profile: Partial<ProfileRecord>) => {
        const existsProfile = getProfile(profileId)!;

        if (!existsProfile) {
            emitEvent('updating', { profile: profile as ProfileRecord, status: 'error', error: new Error(t("profile-not-found", "Profile not found!")) });
            return false;
        }

        passwordRetention(profile);

        const updatedProfile: ProfileRecord = {
            ...existsProfile,
            ...profile,
            sch_updated: DateTime.now().toSQL(),
        };
        setProfiles((prev) =>
            prev.map((profile) => (profile.sch_id === updatedProfile.sch_id ? updatedProfile : profile)) // Zaktualizuj profil w liście
        );
        emitEvent('updating', { profile: updatedProfile, status: 'success' });
        return true;
    }, [passwordRetention]);

    const swapProfilesOrder = useCallback(async (sourceProfileId: string, targetProfileId: string, group?: boolean) => {
        if (!profilesRef.current) {
            return;
        }

        const sourceIndex = profilesRef.current.findIndex(s => s.sch_id === sourceProfileId);
        const targetIndex = profilesRef.current.findIndex(s => s.sch_id === targetProfileId);
        if (sourceIndex === -1 || targetIndex === -1) {
            throw new Error(t("profile-not-found", "Profile not found!"));
        }

        const nextOrder = Math.max(...profilesRef.current.map(s => s.sch_order ?? 0)) + 1;

        let sourceOrder = profilesRef.current[sourceIndex].sch_order ?? (nextOrder);
        let targetOrder = profilesRef.current[targetIndex].sch_order ?? (nextOrder + 1);

        if (group) {
            setProfiles(prev => {
                const newProfiles = prev.slice().sort((a, b) => (a.sch_order ?? 0) - (b.sch_order ?? 0));
                const sourceGroup = newProfiles[sourceIndex].sch_group;
                const targetGroup = newProfiles[targetIndex].sch_group;
                for (let i = 0; i < newProfiles.length; i++) {
                    if (newProfiles[i].sch_group === sourceGroup) {
                        newProfiles[i].sch_order = targetOrder;
                        newProfiles[i].sch_updated = DateTime.now().toSQL();
                        targetOrder += 0.001;
                    } else if (newProfiles[i].sch_group === targetGroup) {
                        newProfiles[i].sch_order = sourceOrder;
                        newProfiles[i].sch_updated = DateTime.now().toSQL();
                        sourceOrder += 0.001;
                    }
                }
                return normalizeOrder(newProfiles);
            });
        }
        else {
            setProfiles(prev => {
                const newProfiles = prev.slice();
                newProfiles[sourceIndex].sch_order = targetOrder;
                newProfiles[sourceIndex].sch_updated = DateTime.now().toSQL();
                newProfiles[targetIndex].sch_order = sourceOrder;
                newProfiles[targetIndex].sch_updated = DateTime.now().toSQL();
                return newProfiles;
            });
        }
    }, []);

    React.useEffect(() => {
        const unsubscribeProfileUpdate = subscribe(PROFILE_UPDATE_MESSAGE, (message: ProfileUpdateMessage) => {
            return updateProfile(message.profileId, message.profile);
        });
        return () => {
            unsubscribeProfileUpdate();
        };
    }, [updateProfile]);

    console.count("ProfilesProvider render");

    return (
        <ProfilesContext.Provider
            value={{
                initialized: profilesInitialized,
                profiles: profiles,
                getProfile,
                reloadProfiles,
                createProfile,
                updateProfile,
                deleteProfile,
                swapProfilesOrder,
                connectToDatabase,
                disconnectSession,
                disconnectProfile,
                testConnection,
                onEvent: onEvent as ProfileEventMethod,
            }}
        >
            {children}
        </ProfilesContext.Provider>
    );
};

export const useProfiles = () => {
    const ctx = useContext(ProfilesContext);
    if (!ctx) throw new Error("useProfiles must be used within a ProfilesProvider");
    return ctx;
};