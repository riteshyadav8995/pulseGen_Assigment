import Sidebar from './Sidebar';

const Layout = ({ children }) => (
  <div className="flex min-h-screen">
    <Sidebar />
    <main className="ml-64 flex-1 p-8 min-h-screen animate-in">
      {children}
    </main>
  </div>
);

export default Layout;
