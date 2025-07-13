import React from "react";
import { useActivity } from "@/contexts/ActivityContext";
import { useAuth } from "../../hooks/useAuth";
import PrincipalView from "./PrincipalView";
import TeacherView from "./TeacherView";

const HomeTab = () => {
    const { addActivity, approveActivity, rejectActivity } = useActivity();
    const { user } = useAuth();
    console.log(user)

    if (user.role === "principal") {
        return (
            <PrincipalView
                user={user}
                approveActivity={approveActivity}
                rejectActivity={rejectActivity}
            />
        );
    }

    return (
        <TeacherView
            addActivity={addActivity}
        />
    );
};

export default HomeTab;