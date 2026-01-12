import useSWR, { SWRConfiguration } from 'swr';
import { useAuth } from '@/context/auth-context';

export const fetcher = async ([url, token]: [string, string]) => {
    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const error = new Error('An error occurred while fetching the data.');
        // @ts-ignore
        error.info = await res.json();
        // @ts-ignore
        error.status = res.status;
        throw error;
    }

    return res.json();
};

export function useAuthenticatedSWR<T>(url: string | null, config?: SWRConfiguration) {
    const { user } = useAuth();

    // Only fetch if user and url are present
    const { data, error, mutate, isValidating } = useSWR<T>(
        user && url ? [url, user] : null,
        async ([u, firebaseUser]: [string, any]) => {
            const token = await firebaseUser.getIdToken();
            return fetcher([u, token]);
        },
        {
            revalidateOnFocus: true,
            revalidateIfStale: true,
            ...config
        }
    );

    return {
        data,
        isLoading: !error && !data,
        isError: error,
        mutate,
        isValidating
    };
}
