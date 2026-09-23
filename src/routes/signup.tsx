import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { set, z } from "zod";
import { AuthShell } from "./../components/AuthShell";
import { Input } from "./../components/ui/input";
import { Label } from "./../components/ui/label";
import { Button } from "./../components/ui/button";
import { toast, Toaster  } from "sonner";
import SOCKETS from "../middleware/sockets";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign Up — Alkebulan" },
      { name: "description", content: "Create your Studio. Create Art. Create Identity" },
      { property: "og:title", content: "Sign Up — Eden" },
      { property: "og:description", content: "Create your Eden account." },
    ],
  }),
  component: SignUp,
});

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Name is too long"),
  phone: z
    .string()
    .trim()
    .regex(/^254\d{9}$/, "Phone must be in the format 254xxxxxxxxx"),
  password: z.string().min(6, "Password must be at least 6 characters").max(72, "Password is too long"),
});

function SignUp() {
  const [name, setName] = useState<String | any>("");
  const [phone, setPhone] = useState<String | any>("");
  const [password, setPassword] = useState<String | any>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verify_phone,setVerifyPhone] = useState<boolean>(false);
  const [verify,setVerify] = useState<boolean>(false);
  const [loading,setLoading] = useState<boolean>(false);

  const navigate = useNavigate()
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // console.log("submitting..")
    setLoading(true)
    //UPDATE verify phone
    // if(!verify_phone){
    //   toast.error("Verify Phone Number")
    //   setLoading(false)
    //   return;
    // }
    
    const result = schema.safeParse({ name, phone, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      setLoading(false)
      return;
    }
    setErrors({});
    const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_SIGN_UP : import.meta.env.VITE_SIGN_UP_LIVE}`,{
      method:"POST",
      credentials: "include",
      body : JSON.stringify({
        name,
        password,
        telephone:phone
      }),
      headers: {
        'Content-Type': 'application/json', // Indicates the body is JSON
        'x-api-key':import.meta.env.VITE_API_KEY
      },
    });

    const {status, error, message} = await res.json()

    console.log(status,"status",message,"message")
    setLoading(false)
    if(error){
      toast.error('Retry: ' + error)
      return 
    }
    
    if(status){
      toast.success(message)
      toast.success("Account created! Lights, camera, action.");
//       navigate({
//   to: "/users/$userId",
//   params: { userId: "123" },
// });
      navigate({
        to:"/signin"
      })
    }else{
      toast.error(message)
    }

    return;
      
  }

  const validatePhone = (phone:string) => {
    const regex = /^254\d{9}$/;
    return regex.test(phone);
  };

  const verifyPhone = async() => {
    
    setVerify(true)
    if(validatePhone(phone) === false){
      toast.error("Invalid Phone Number")
      setVerify(false)
      return false
    }
    const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_CHECK_PHONE : import.meta.env.VITE_CHECK_PHONE_LIVE}`,{
      method:"POST",
      body : JSON.stringify({
        telephone:phone
      }),
      headers: {
        'Content-Type': 'application/json', // Indicates the body is JSON
        'x-api-key':import.meta.env.VITE_API_KEY
      },
    });

    const {status, data, message} = await res.json()

    if(!status || data.ResponseCode !== "0"){
      toast.error(message)
      setVerify(false)
      return false
    }
    //start socket io
    // console.log(data)

    const socketInstance = await SOCKETS.connect();
    // SOCKETS.socketConnect()
    socketInstance.connect()
    socketInstance.emit("user", data.MerchantRequestID)
    socketInstance.on("callback", async({data}:{data:any}) => {
      //check if payment was cancelled
      // console.log(data)
      if(data.ResultCode !== 0){
        toast.error("transaction canceled")
        socketInstance.emit("destroy", data.MerchantRequestID);
        return null
      }
      toast.success("success!")
      setVerifyPhone(true)
      setVerify(false)
      socketInstance.emit("destroy", data.MerchantRequestID)
      const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_PAYMENT : import.meta.env.VITE_PAYMENT_LIVE}`,{
        method:"POST",
        credentials: "include",
        body : JSON.stringify({
          data: {...data, purpose:"verify studio"},
          email:"",
          type:"mpesa"
        }),
        headers: {
          'Content-Type': 'application/json', // Indicates the body is JSON
          'x-api-key':import.meta.env.VITE_API_KEY
        },
      });        
    })
  }
  return (
    <>
      <Toaster richColors position="top-center" />
      <AuthShell title="Sign Up" subtitle="Reshape the Narrative.">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">Studio Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Independent Studios"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <p>Phone Number Must Accept M-Pesa</p>
            <Label htmlFor="phone">Telephone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="254712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Button
              type="button"
              disabled={verify}
              onClick={() => verifyPhone()}
              className="w-[30%] m-[1%] bg-amber border-[#fff] border-1 rounded-md"
            >
              {verify ? "Verifying..." : "Verify"}
            </Button>
            {errors.phone ? (
              <p className="text-xs text-destructive">{errors.phone}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Format: 254 followed by 9 digits</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full uppercase tracking-widest"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          >
            {loading ? "Creating Studio..." : "Create Studio"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/signin" className="font-semibold text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </AuthShell>
    </>
  );
}

