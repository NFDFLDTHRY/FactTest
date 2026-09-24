//! GeneratedBundle store: bounded arena of (path, role, bytes, sha256).

use factc_foundation::sha256::Sha256;
use factc_foundation::BVec;

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum Role {
    WasmModule,
    HostMembrane,
    RuntimeSelector,
    RuntimeEvidence,
    Shell,
    Manifest,
    ServiceWorker,
    Metadata,
}

impl Role {
    pub const fn name(self) -> &'static str {
        match self {
            Role::WasmModule => "WASM_MODULE",
            Role::HostMembrane => "HOST_MEMBRANE",
            Role::RuntimeSelector => "RUNTIME_SELECTOR",
            Role::RuntimeEvidence => "RUNTIME_EVIDENCE",
            Role::Shell => "SHELL",
            Role::Manifest => "MANIFEST",
            Role::ServiceWorker => "SERVICE_WORKER",
            Role::Metadata => "METADATA",
        }
    }
}

pub const BUNDLE_BYTES: usize = 384 * 1024;
pub const MAX_FILES: usize = 16;

#[derive(Copy, Clone, Debug)]
pub struct BundleFile {
    pub path_bytes: [u8; 48],
    pub path_len: u8,
    pub role: Role,
    pub off: u32,
    pub len: u32,
    pub sha256: [u8; 32],
}

impl BundleFile {
    pub fn path(&self) -> &[u8] {
        &self.path_bytes[..self.path_len as usize]
    }
}

pub struct BundleStore {
    pub bytes: [u8; BUNDLE_BYTES],
    pub used: usize,
    pub files: BVec<BundleFile, MAX_FILES>,
    pub bundle_id: [u8; 32],
}

impl core::fmt::Debug for BundleStore {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        f.debug_struct("BundleStore")
            .field("files", &self.files.len())
            .field("used", &self.used)
            .finish()
    }
}

#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub struct BundleFull;

impl Default for BundleStore {
    fn default() -> Self {
        Self::new()
    }
}

impl BundleStore {
    pub const fn new() -> Self {
        BundleStore {
            bytes: [0; BUNDLE_BYTES],
            used: 0,
            files: BVec::new(),
            bundle_id: [0; 32],
        }
    }
    pub fn clear(&mut self) {
        self.used = 0;
        self.files.clear();
        self.bundle_id = [0; 32];
    }
    pub fn add(&mut self, path: &[u8], role: Role, data: &[u8]) -> Result<(), BundleFull> {
        if self.used + data.len() > BUNDLE_BYTES || path.len() > 48 || self.files.len() >= MAX_FILES
        {
            return Err(BundleFull);
        }
        let off = self.used;
        self.bytes[off..off + data.len()].copy_from_slice(data);
        self.used += data.len();
        let mut pb = [0u8; 48];
        pb[..path.len()].copy_from_slice(path);
        let f = BundleFile {
            path_bytes: pb,
            path_len: path.len() as u8,
            role,
            off: off as u32,
            len: data.len() as u32,
            sha256: factc_foundation::sha256::digest(data),
        };
        self.files.push(f).map_err(|_| BundleFull)?;
        Ok(())
    }
    pub fn bytes(&self, f: &BundleFile) -> &[u8] {
        &self.bytes[f.off as usize..(f.off + f.len) as usize]
    }
    pub fn get(&self, path: &[u8]) -> Option<&[u8]> {
        self.files
            .iter()
            .find(|f| f.path() == path)
            .map(|f| self.bytes(f))
    }
    /// Bundle identity: sha256 over (source sha256 || each file's sha256 in emission order) at the time of call.
    pub fn identity(&self, source_sha256: &[u8; 32]) -> [u8; 32] {
        let mut h = Sha256::new();
        h.update(source_sha256);
        for f in self.files.iter() {
            h.update(f.path());
            h.update(&f.sha256);
        }
        h.finalize()
    }
}
