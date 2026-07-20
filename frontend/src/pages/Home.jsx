import { useState } from "react";
import api from "../api/api";

import Navbar from "../components/Navbar";
import Button from "../components/Button";
import StatusCard from "../components/StatusCard";

function Home() {

    const [status, setStatus] = useState("Click button to check");

    const checkBackend = async () => {

        try {

            const response = await api.get("/");

            setStatus(response.data.message);

        }

        catch {

            setStatus("Backend Not Connected ❌");

        }

    };

    return (

        <>

            <Navbar />

            <div className="container">

                <h1>Welcome</h1>

                <p>

                    AI Powered Cardiovascular Disease
                    Risk Screening System

                </p>

                <StatusCard status={status} />

                <Button

                    title="Check Backend Connection"

                    onClick={checkBackend}

                />

            </div>

        </>

    )

}

export default Home;